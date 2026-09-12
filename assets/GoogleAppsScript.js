// 2026 蔬食月 Google Apps Script Web App 設定檔
// 正式部署發布之 Web App URL
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwms3Fo0wJO7Dw7grjZBDYcUwxuORhCcxb1G8A3pKcLI8l0BfU40Ao4mVWwJWkrmzAH1g/exec";

/* ==========================================================================
 * 2026 蔬食月・森活賓果卡 前端核心互動邏輯與連線模組
 * ========================================================================== */

// 預設備用任務清單（依據活動宣傳與集點「森活賓果卡」官方規範）
    const DEFAULT_TASKS = [
      { id: 1, title: "環保杯與餐具", desc: "使用環保杯或環保餐具購買飲料或餐點一次", code: "ECO2026" },
      { id: 2, title: "看靜態展+許願樹", desc: "看靜態展+許願樹（現場驗證）", code: "TREE2026" },
      { id: 3, title: "IG 分享靜態展", desc: "在 IG 限動分享靜態展並標註社團", code: "IGEXPO2026" },
      { id: 4, title: "運動會擺攤", desc: "參加 11/11 運動會擺攤（現場驗證）", code: "SPORT1111" },
      { id: 5, title: "吃一餐蔬食餐", desc: "吃一餐蔬食餐", code: "VEG2026" },
      { id: 6, title: "IG 分享料理實作", desc: "在 IG 限動分享料理實作並標註社團", code: "IGCOOK2026" },
      { id: 7, title: "帶好友同行", desc: "帶一位朋友參加蔬食月活動（現場驗證 兩人皆可蓋）", code: "FRIEND2026" },
      { id: 8, title: "料理實作", desc: "參加 11/18 料理實作（現場驗證）", code: "COOK1118" },
      { id: 9, title: "主題社課（擇一）", desc: "參加 10/14 前行社課或 11/25 總結社課（擇一）（現場驗證）", code: "CLASS2026" }
    ];

    // 動態任務清單（完全依據試算表同步資料）
    function getInitialTasks() {
      try {
        const cached = JSON.parse(localStorage.getItem("veg_tasks_cache") || "null");
        if (cached && Array.isArray(cached) && cached.length === 9) {
          return cached;
        }
      } catch(e) {
        console.warn(e);
      }
      return DEFAULT_TASKS;
    }

    let TASKS_DEF = getInitialTasks();

    // 工作人員通關碼（預設備用代碼，後續從試算表第 0 格動態取得）
    let sessionStaffCode = "";

    // 優先讀取 ./assets/GoogleAppsScript.js 中定義的網址
    let gasApiUrl = typeof GOOGLE_APPS_SCRIPT_URL !== "undefined" && GOOGLE_APPS_SCRIPT_URL 
      ? GOOGLE_APPS_SCRIPT_URL.trim() 
      : (localStorage.getItem("veg_gas_api_url") || "");

    let currentUser = null;
    let isStaffMode = false;

    window.addEventListener("DOMContentLoaded", () => {
      const savedUser = localStorage.getItem("veg_current_user");
      if (savedUser) {
        try {
          currentUser = JSON.parse(savedUser);
          renderBingoCard();
        } catch (e) {
          console.error("Failed to parse saved user", e);
        }
      }
      
      if (gasApiUrl) {
        document.getElementById("gasEndpoint").value = gasApiUrl;
        // 自動向試算表同步最新九宮格任務與工作人員綠色通道代碼
        fetchTasksFromCloud();
        // 自動與雲端校正最新蓋章進度
        if (currentUser && currentUser.serial) {
          syncCardWithCloud(currentUser.serial, true);
        }
      }
    });

    function showToast(msg, duration = 3000) {
      const toast = document.getElementById("toast");
      toast.innerText = msg;
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, duration);
    }

    function openRegisterModal() {
      document.getElementById("registerModal").style.display = "flex";
      document.getElementById("regName").focus();
    }

    function openLookupModal() {
      document.getElementById("lookupModal").style.display = "flex";
      document.getElementById("lookupSerial").focus();
    }

    function openConfigModal() {
      document.getElementById("configModal").style.display = "flex";
      document.getElementById("testResultBox").style.display = "none";
      if (gasApiUrl) {
        document.getElementById("gasEndpoint").value = gasApiUrl;
      }
    }

    function closeModal(id) {
      document.getElementById(id).style.display = "none";
    }

    // 切換為工作人員身份（記憶體存放通行碼，由後端蓋章時校驗）
    function toggleStaffMode() {
      if (!isStaffMode) {
        const input = prompt("請輸入工作人員認證代碼以開啟綠色通道：");
        if (input === null) return;
        const cleanInput = input.trim();
        if (!cleanInput) {
          alert("認證代碼不可為空！");
          return;
        }
        sessionStaffCode = cleanInput;
        isStaffMode = true;
        document.getElementById("staffIndicator").style.display = "inline-block";
        showToast("已切換為工作人員身份（綠色通道已備妥）");
      } else {
        isStaffMode = false;
        sessionStaffCode = "";
        document.getElementById("staffIndicator").style.display = "none";
        showToast("已切換回一般學員身份");
      }
    }

    // 從試算表動態同步任務與第 0 格工作人員通關碼
    async function fetchTasksFromCloud(quiet = true) {
      if (!gasApiUrl) return;
      try {
        const resp = await fetch(`${gasApiUrl}?action=getTasks&t=${Date.now()}`);
        const res = await resp.json();
        
        if (res.success) {
          if (Array.isArray(res.tasks) && res.tasks.length === 9) {
            TASKS_DEF = res.tasks;
            localStorage.setItem("veg_tasks_cache", JSON.stringify(TASKS_DEF));
          }
// 後端已不再於公開 API 傳輸工作人員代碼，密碼絕不洩漏
          if (currentUser) {
            renderBingoCard();
          }
          if (!quiet) {
            showToast("九宮格任務已與試算表同步完成！");
          }
        }
      } catch (err) {
        console.warn("無法即時取得線上任務設定，使用快取或預設設定", err);
      }
    }

    // 與 Google 試算表即時校正卡片資料
    async function syncCardWithCloud(serial, quiet = false) {
      if (!gasApiUrl || !serial) return;
      try {
        const resp = await fetch(`${gasApiUrl}?action=getCard&serial=${encodeURIComponent(serial)}&t=${Date.now()}`);
        const res = await resp.json();
        if (res.success && res.data) {
          currentUser = res.data;
          saveCurrentUserData();
          renderBingoCard();
          if (!quiet) {
            showToast("已成功與 Google 試算表完全同步！");
          }
        }
      } catch (e) {
        console.warn("背景同步失敗", e);
      }
    }

    // 連線診斷測試功能
    async function testConnection() {
      const url = gasApiUrl;
      const box = document.getElementById("testResultBox");
      if (!url) {
        box.style.display = "block";
        box.style.background = "#ffebee";
        box.style.color = "#c62828";
        box.innerText = "未讀取到 Web App URL，請確認 ./assets/GoogleAppsScript.js 是否存在。";
        return;
      }

      box.style.display = "block";
      box.style.background = "#e3f2fd";
      box.style.color = "#1565c0";
      box.innerText = "正在向 Google Apps Script 發送診斷請求...";

      try {
        const resp = await fetch(`${url}?action=test&t=${Date.now()}`);
        const text = await resp.text();
        let res;
        try {
          res = JSON.parse(text);
        } catch (parseErr) {
          box.style.background = "#ffebee";
          box.style.color = "#c62828";
          box.innerHTML = `<strong>連線異常（未取得 JSON）</strong><br>伺服器回傳了 HTML 內容（可能是 Google 登入畫面）。<br><strong>原因：</strong>Apps Script 部署時的「誰可以存取 (Who has access)」未設定為「所有人 (Anyone)」。`;
          return;
        }

        if (res.success) {
          box.style.background = "#e8f5e9";
          box.style.color = "#2e7d32";
          box.innerHTML = `<strong>連線成功！</strong><br>${res.message || "API 運作正常"}<br>工作表：${res.sheetName || "總表"}（共 ${res.totalRows || 0} 列資料）<br>九宮格任務數：${res.tasksCount || 0} 格<br>工作人員綠色通道代碼：${res.staffCode ? "已讀取成功" : "未設定（使用預設）"}`;
        } else {
          box.style.background = "#fff3e0";
          box.style.color = "#e65100";
          box.innerHTML = `<strong>後端回傳錯誤：</strong>${res.error || res.message}`;
        }
      } catch (netErr) {
        box.style.background = "#ffebee";
        box.style.color = "#c62828";
        box.innerHTML = `<strong>連線失敗：</strong>${netErr.message}<br>若使用本機 file:// 開啟，瀏覽器可能阻擋跨域重定向。請確認 Web App 部署權限設為「所有人 (Anyone)」。`;
      }
    }

    function generateSerial() {
      const num = Math.floor(100000 + Math.random() * 900000);
      return `VEG-2026-${num}`;
    }

    // 處理報名
    async function handleRegister(e) {
      e.preventDefault();
      const name = document.getElementById("regName").value.trim();
      const studentId = document.getElementById("regStudentId").value.trim();
      const contact = document.getElementById("regContact").value.trim();

      if (!name || !studentId || !contact) {
        alert("請完整填寫所有必填欄位");
        return;
      }

      const submitBtn = document.getElementById("btnSubmitReg");
      submitBtn.disabled = true;
      submitBtn.innerText = "登記資料中...";

      const serial = generateSerial();
      const newUser = {
        serial: serial,
        name: name,
        studentId: studentId,
        contact: contact,
        stamps: [0, 0, 0, 0, 0, 0, 0, 0, 0], // 改用 0 代表未蓋章
        createdAt: new Date().toISOString()
      };

      if (gasApiUrl) {
        try {
          await fetch(gasApiUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "register",
              payload: newUser
            })
          });
          showToast("已同步登記至 Google 試算表！");
        } catch (err) {
          console.warn("GAS 串接未成功，切換為本機儲存模式", err);
        }
      }

      currentUser = newUser;
      saveCurrentUserData();
      
      closeModal("registerModal");
      submitBtn.disabled = false;
      submitBtn.innerText = "完成報名並取得賓果卡";

      renderBingoCard();
      showToast(`報名成功！您的流水號為：${serial}`);
    }

    // 查詢卡片（雲端優先）
    async function handleLookup(e) {
      e.preventDefault();
      const serial = document.getElementById("lookupSerial").value.trim();
      if (!serial) return;

      const submitBtn = document.getElementById("btnSubmitLookup");
      submitBtn.disabled = true;
      submitBtn.innerText = "查詢中...";

      // 優先向 Google 試算表（雲端單一真相來源）檢索最新資料
      if (gasApiUrl) {
        showToast("正在從 Google 試算表檢索卡片最新狀態...");
        try {
          const fetchUrl = `${gasApiUrl}?action=getCard&serial=${encodeURIComponent(serial)}&t=${Date.now()}`;
          const resp = await fetch(fetchUrl);
          const text = await resp.text();
          
          let res;
          try {
            res = JSON.parse(text);
          } catch (pErr) {
            submitBtn.disabled = false;
            submitBtn.innerText = "查詢卡片";
            alert("【連線失敗】未能取得有效的 JSON 回應。\n\n最常見原因：\n1. Google Apps Script 部署時的「誰可以存取 (Who has access)」未設為「所有人 (Anyone)」，導致被導向 Google 登入畫面。\n請至 Apps Script 重新部署確認。");
            return;
          }

          if (res.success && res.data) {
            currentUser = res.data;
            saveCurrentUserData();
            closeModal("lookupModal");
            submitBtn.disabled = false;
            submitBtn.innerText = "查詢卡片";
            renderBingoCard();
            showToast("已從 Google 試算表同步最新進度！");
            return;
          } else {
            submitBtn.disabled = false;
            submitBtn.innerText = "查詢卡片";
            alert(`【試算表回報】${res.message || res.error || "查無此流水號"}\n\n若試算表中確實有此筆資料，請確認：\n1. 工作表分頁名稱是否為「學員報名與賓果總表」\n2. 流水號欄位前後是否有空白字元`);
            return;
          }
        } catch (err) {
          console.warn("雲端查詢失敗，降級查詢本機快取", err);
        }
      }

      // 降級方案：離線或無後端時查詢本機
      const local = localStorage.getItem("veg_user_" + serial);
      if (local) {
        currentUser = JSON.parse(local);
        saveCurrentUserData();
        closeModal("lookupModal");
        submitBtn.disabled = false;
        submitBtn.innerText = "查詢卡片";
        renderBingoCard();
        showToast("（離線模式）已載入本機暫存進度！");
        return;
      }

      submitBtn.disabled = false;
      submitBtn.innerText = "查詢卡片";
      alert("查無此流水號！\n請確認號碼是否正確，或至 Google 試算表核對。");
    }

    function saveCurrentUserData() {
      if (!currentUser) return;
      localStorage.setItem("veg_current_user", JSON.stringify(currentUser));
      localStorage.setItem("veg_user_" + currentUser.serial, JSON.stringify(currentUser));
    }

    function resetCurrentCard() {
      if (confirm("確定要切換卡片嗎？您的進度已儲存在此瀏覽器與流水號中。")) {
        currentUser = null;
        localStorage.removeItem("veg_current_user");
        document.getElementById("heroCard").style.display = "block";
        document.getElementById("bingoSection").style.display = "none";
        showToast("已返回首頁");
      }
    }

    // 渲染九宮格與進度（支援 1/0 與布林值相容）
    function renderBingoCard() {
      if (!currentUser) return;

      document.getElementById("heroCard").style.display = "none";
      document.getElementById("bingoSection").style.display = "block";

      document.getElementById("metaSerial").innerText = currentUser.serial;
      document.getElementById("metaName").innerText = currentUser.name;

      // 判斷蓋章狀態（1 或 true 視為已蓋章）
      const isCellStamped = (val) => val == 1 || val === true || String(val).trim() === "1" || String(val).trim().toUpperCase() === "TRUE";

      const stampedCount = currentUser.stamps.filter(isCellStamped).length;
      document.getElementById("metaProgress").innerText = stampedCount;

      const lines = calculateBingoLines(currentUser.stamps);
      document.getElementById("metaLines").innerText = lines.count;

      const gridContainer = document.getElementById("bingoGrid");
      gridContainer.innerHTML = "";

      TASKS_DEF.forEach((task, idx) => {
        const isStamped = isCellStamped(currentUser.stamps[idx]);
        const isCenter = idx === 4;
        const isLineCell = lines.involvedCells.includes(idx);

        const cell = document.createElement("div");
        cell.className = `grid-cell ${isStamped ? "stamped" : ""} ${isCenter ? "center-cell" : ""} ${isLineCell ? "bingo-line" : ""}`;
        cell.onclick = () => openStampModal(idx);

        cell.innerHTML = `
          <div class="cell-number">#${idx + 1} ${isCenter ? "★ 核心任務" : ""}</div>
          <div class="cell-title">${task.title}</div>
          <div class="cell-desc">${task.desc}</div>
          <div class="cell-status-hint">${isStamped ? "已蓋章" : "點擊蓋章 →"}</div>
          <img class="stamp-mark" src="./img/抱抱地球2.png" alt="已蓋章">
        `;

        gridContainer.appendChild(cell);
      });
    }

    function openStampModal(idx) {
      if (!currentUser) return;
      const task = TASKS_DEF[idx];
      const isCellStamped = (val) => val == 1 || val === true || String(val).trim() === "1" || String(val).trim().toUpperCase() === "TRUE";
      const isStamped = isCellStamped(currentUser.stamps[idx]);

      if (isStamped) {
        showToast(`【第 ${idx + 1} 格：${task.title}】已經蓋過印章囉！`);
        return;
      }

      document.getElementById("stampGridIndex").value = idx;
      document.getElementById("stampModalTitle").innerText = `任務蓋章：#${idx + 1} ${task.title}`;
      document.getElementById("stampModalDesc").innerText = `${task.desc}`;
      document.getElementById("verifyCode").value = "";

      // 根據是否已切換為工作人員身份，顯示工作人員綠色通道
      document.getElementById("staffQuickSection").style.display = isStaffMode ? "block" : "none";
      document.getElementById("stampModal").style.display = "flex";
      document.getElementById("verifyCode").focus();
    }

    function handleVerifyStamp(e) {
      e.preventDefault();
      const idx = parseInt(document.getElementById("stampGridIndex").value, 10);
      const codeInput = document.getElementById("verifyCode").value.trim().toUpperCase();
      const expectedCode = TASKS_DEF[idx].code.toUpperCase();

      if (codeInput !== expectedCode) {
        alert('通關代碼錯誤！請向該活動關主確認通關代碼。');
        return;
      }

      confirmStamp(false);
    }

    // 執行蓋章（可靠同步：等待試算表確認回傳後才蓋章）
    async function confirmStamp(isBypass) {
      const idx = parseInt(document.getElementById("stampGridIndex").value, 10);
      
      const btnStaff = document.querySelector("#staffQuickSection button");
      const btnSubmit = document.querySelector("#stampModal button[type='submit']");
      if (btnStaff) { btnStaff.disabled = true; btnStaff.innerText = "寫入試算表中..."; }
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = "蓋章寫入中..."; }
      showToast("正在寫入 Google 試算表...");

      if (gasApiUrl) {
        try {
          const stampUrl = `${gasApiUrl}?action=stamp&serial=${encodeURIComponent(currentUser.serial)}&gridIndex=${idx}&isStaffOverride=${isBypass}&staffPasscode=${encodeURIComponent(isBypass ? sessionStaffCode : "")}&t=${Date.now()}`;
          const resp = await fetch(stampUrl);
          const res = await resp.json();
          
          if (!res.success) {
            alert(`【雲端寫入失敗】${res.message || res.error}\n本機暫不更新，請稍後重試。`);
            if (btnStaff) { btnStaff.disabled = false; btnStaff.innerText = "工作人員綠色通道蓋章"; }
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "驗證並蓋章"; }
            return;
          }
        } catch (err) {
          console.error("GAS 蓋章請求失敗", err);
          const goLocal = confirm(`向 Google 試算表寫入時發生連線錯誤：\n${err.message}\n\n是否仍要先在本機標記蓋章？\n（建議檢查網路後重新蓋章以確保試算表同步）`);
          if (!goLocal) {
            if (btnStaff) { btnStaff.disabled = false; btnStaff.innerText = "工作人員綠色通道蓋章"; }
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "驗證並蓋章"; }
            return;
          }
        }
      }

      // 改用數值 1 記錄已蓋章
      currentUser.stamps[idx] = 1;
      saveCurrentUserData();

      if (btnStaff) { btnStaff.disabled = false; btnStaff.innerText = "工作人員綠色通道蓋章"; }
      if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "驗證並蓋章"; }

      closeModal("stampModal");
      renderBingoCard();

      const lines = calculateBingoLines(currentUser.stamps);
      if (lines.count > 0) {
        showToast(`恭喜！第 ${idx + 1} 格已寫入試算表，目前達成 ${lines.count} 條賓果連線！`);
      } else {
        showToast(`第 ${idx + 1} 格已成功寫入試算表！`);
      }
    }

    // 計算連線（相容 1 與 true）
    function calculateBingoLines(stamps) {
      const isCellStamped = (val) => val == 1 || val === true || String(val).trim() === "1" || String(val).trim().toUpperCase() === "TRUE";

      const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      let count = 0;
      let involved = new Set();

      winningCombos.forEach(combo => {
        if (combo.every(idx => isCellStamped(stamps[idx]))) {
          count++;
          combo.forEach(idx => involved.add(idx));
        }
      });

      return {
        count: count,
        involvedCells: Array.from(involved)
      };
    }
