# 蔬食月九宮格賓果系統 —— Google Apps Script 後端設定（v7 時區修正版）

```javascript
/**
 * 2026 蔬食月九宮格賓果卡後端程式 (v7 時區修正版)
 * 修正重點：強制時間格式為台灣標準時間 GMT+8（Asia/Taipei），解決試算表預設 GMT+0 問題
 */

const PREFERRED_USERS_SHEET = "學員報名與賓果總表";
const PREFERRED_TASKS_SHEET = "九宮格任務與通關碼設定";
const LOG_SHEET_NAME = "簽到與核銷紀錄歷程";

function getUsersSheet(ss) {
  let sheet = ss.getSheetByName(PREFERRED_USERS_SHEET);
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

function getTasksSheet(ss) {
  let sheet = ss.getSheetByName(PREFERRED_TASKS_SHEET);
  if (!sheet) {
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().indexOf("任務") !== -1) {
        return sheets[i];
      }
    }
    sheet = sheets.length > 1 ? sheets[1] : sheets[0];
  }
  return sheet;
}

// 讀取九宮格任務（1~9 格）與工作人員綠色通道代碼（第 0 格）
function getTasksAndStaffCode(ss) {
  const sheet = getTasksSheet(ss);
  const data = sheet.getDataRange().getValues();
  const tasks = [];
  let staffCode = "nthu.bwy2026"; // 預設代碼
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const gridIdStr = String(row[0]).trim();
    
    // 若編號為 0 或標題包含「工作人員」，擷取為綠色通道認證碼（僅留在後端校驗，絕不外洩）
    if (gridIdStr === "0" || String(row[1]).indexOf("工作人員") !== -1) {
      staffCode = String(row[3] || "").trim() || staffCode;
    } else if (gridIdStr !== "" && tasks.length < 9) {
      tasks.push({
        id: tasks.length + 1,
        title: String(row[1] || "").trim(),
        desc: String(row[2] || "").trim(),
        code: String(row[3] || "").trim()
      });
    }
  }
  
  return { tasks: tasks, staffCode: staffCode };
}

// 處理 GET 請求
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "";
    const serial = (e && e.parameter && e.parameter.serial) || "";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getUsersSheet(ss);
    const meta = getTasksAndStaffCode(ss);
    
    // 1. 蓋章端點（寫入數值 1）
    if (action === "stamp" && serial) {
      const gridIndex = parseInt(e.parameter.gridIndex, 10);
      const isStaffOverride = e.parameter.isStaffOverride === "true";
      const staffPasscode = e.parameter.staffPasscode || "";
      return handleStamp(ss, sheet, {
        serial: serial,
        gridIndex: gridIndex,
        isStaffOverride: isStaffOverride,
        staffPasscode: staffPasscode
      });
    }

    // 2. 動態任務查詢端點（安全：絕不回傳 staffCode）
    if (action === "getTasks") {
      return createJsonResponse({
        success: true,
        tasks: meta.tasks,
        sheetName: getTasksSheet(ss).getName()
      });
    }
    
    // 3. 診斷測試端點
    if (action === "test") {
      return createJsonResponse({
        success: true,
        message: "Google Apps Script 服務連線正常！",
        sheetName: sheet.getName(),
        totalRows: sheet.getLastRow(),
        tasksCount: meta.tasks.length,
        staffConfigured: meta.staffCode ? "已由試算表設定" : "未設定"
      });
    }
    
    // 4. 查詢個人卡片端點（安全：絕不回傳 staffCode）
    if (action === "getCard" && serial) {
      const user = findUserBySerial(sheet, serial);
      if (user) {
        return createJsonResponse({ 
          success: true, 
          data: user, 
          tasks: meta.tasks
        });
      } else {
        return createJsonResponse({
          success: false,
          message: "在工作表「" + sheet.getName() + "」中未找到流水號「" + serial + "」。"
        });
      }
    }
    
    return createJsonResponse({
      success: true,
      message: "蔬食月 API 服務運作正常",
      currentSheet: sheet.getName()
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// 處理 POST 請求
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getUsersSheet(ss);
    
    if (action === "register") {
      return handleRegister(sheet, payload);
    } else if (action === "stamp") {
      return handleStamp(ss, sheet, payload);
    }
    
    return createJsonResponse({ success: false, message: "無效的操作指令" });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// 報名處理（支援 6 碼流水號防碰撞檢查）
function handleRegister(sheet, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  
  try {
    const data = sheet.getDataRange().getValues();
    const existingSerials = new Set();
    for (let i = 1; i < data.length; i++) {
      existingSerials.add(String(data[i][0]).trim().toUpperCase());
    }

    let serial = payload.serial;
    // 若流水號為空或已存在，自動重新配發不重複之 6 位流水號
    if (!serial || existingSerials.has(String(serial).trim().toUpperCase())) {
      let num;
      do {
        num = Math.floor(100000 + Math.random() * 900000);
        serial = "VEG-2026-" + num;
      } while (existingSerials.has(serial));
    }
    
    const nowStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm:ss");
    const rowData = [
      serial,
      nowStr, // 建立時間（強制 GMT+8 台灣時間）
      payload.name,
      payload.studentId,
      payload.contact,
      0, 0, 0, 0, 0, 0, 0, 0, 0, // 格 1~9 使用數值 0
      0,
      "未兌獎",
      nowStr  // 最後更新時間（強制 GMT+8 台灣時間）
    ];
    
    sheet.appendRow(rowData);
    SpreadsheetApp.flush();
    return createJsonResponse({ success: true, serial: serial });
  } finally {
    lock.releaseLock();
  }
}

// 蓋章處理（含格子範圍檢查、綠色通道後端驗證、冪等防護）
function handleStamp(ss, sheet, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  
  try {
    const gridIndex = parseInt(payload.gridIndex, 10);
    
    // 1. 格子範圍安全驗證（P1-1）
    if (isNaN(gridIndex) || gridIndex < 0 || gridIndex > 8) {
      return createJsonResponse({ success: false, message: "格子索引超出範圍（必須為 0 至 8）" });
    }

    // 2. 工作人員綠色通道安全認證（後端核驗，杜絕偽造）
    if (payload.isStaffOverride) {
      const meta = getTasksAndStaffCode(ss);
      const inputCode = String(payload.staffPasscode || "").trim();
      const actualCode = String(meta.staffCode || "").trim();
      if (!actualCode || inputCode !== actualCode) {
        return createJsonResponse({
          success: false,
          message: "工作人員認證代碼錯誤，非工作人員無法使用綠色通道核銷！"
        });
      }
    }

    const data = sheet.getDataRange().getValues();
    const targetSerial = String(payload.serial).trim().toUpperCase();
    
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      const rowSerial = String(data[i][0]).trim().toUpperCase();
      if (rowSerial === targetSerial) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return createJsonResponse({ success: false, message: "找不到學員流水號：" + targetSerial });
    }
    
    // F 欄為第 6 欄（格1）；N 欄為第 14 欄（格9）
    const targetCol = 6 + gridIndex;

    // 3. 冪等性防重複蓋章機制（P1-2）
    const currentVal = sheet.getRange(targetRow, targetCol).getValue();
    const alreadyStamped = (currentVal == 1 || currentVal === true ||
      String(currentVal).trim() === "1" || String(currentVal).trim().toUpperCase() === "TRUE");
    
    if (alreadyStamped) {
      const linesCount = sheet.getRange(targetRow, 15).getValue() || 0;
      return createJsonResponse({
        success: true,
        alreadyStamped: true,
        lines: linesCount,
        gridIndex: gridIndex,
        message: "第 " + (gridIndex + 1) + " 格先前已完成核銷。"
      });
    }

    // 寫入蓋章數值 1 與最後更新時間（強制 GMT+8 台灣時間）
    const nowStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm:ss");
    sheet.getRange(targetRow, targetCol).setValue(1);
    sheet.getRange(targetRow, 17).setValue(nowStr);
    
    SpreadsheetApp.flush();
    
    const updatedRowValues = sheet.getRange(targetRow, 6, 1, 9).getValues()[0];
    const linesCount = calculateLines(updatedRowValues);
    sheet.getRange(targetRow, 15).setValue(linesCount);
    
    const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (logSheet) {
      logSheet.appendRow([
        nowStr,
        payload.serial,
        data[targetRow - 1][2],
        "第 " + (gridIndex + 1) + " 格",
        payload.isStaffOverride ? "工作人員綠色通道核銷" : "官方通關碼核銷"
      ]);
    }
    
    SpreadsheetApp.flush();
    return createJsonResponse({ success: true, lines: linesCount, gridIndex: gridIndex });
  } finally {
    lock.releaseLock();
  }
}

// 依流水號查詢學員（相容 1 與 TRUE）
function findUserBySerial(sheet, serial) {
  const data = sheet.getDataRange().getValues();
  const searchKey = String(serial).trim().toUpperCase();
  
  for (let i = 1; i < data.length; i++) {
    const rowKey = String(data[i][0]).trim().toUpperCase();
    if (rowKey === searchKey) {
      const stamps = [];
      for (let g = 5; g < 14; g++) {
        const val = data[i][g];
        // 相容 1、TRUE、"1"、"TRUE"
        const isCompleted = (val == 1 || val === true || String(val).trim() === "1" || String(val).trim().toUpperCase() === "TRUE") ? 1 : 0;
        stamps.push(isCompleted);
      }
      return {
        serial: data[i][0],
        name: data[i][2],
        studentId: data[i][3],
        contact: data[i][4],
        stamps: stamps,
        lines: data[i][14] || 0
      };
    }
  }
  return null;
}

// 連線試算（相容 1 與 true）
function calculateLines(stamps) {
  const isDone = (v) => v == 1 || v === true || String(v).trim() === "1" || String(v).trim().toUpperCase() === "TRUE";
  const combos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  let lines = 0;
  for (let i = 0; i < combos.length; i++) {
    const c = combos[i];
    if (isDone(stamps[c[0]]) && isDone(stamps[c[1]]) && isDone(stamps[c[2]])) {
      lines++;
    }
  }
  return lines;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 試算表分頁：「九宮格任務與通關碼設定」最新對照表（森活賓果卡官方版）

請將以下欄位內容複製至 Google 試算表「九宮格任務與通關碼設定」中（前端系統將會自動讀取同步）：

| 格子編號 | 任務標題 | 任務說明 / 條件 | 官方通關代碼 |
|---|---|---|---|
| 0 | 工作人員綠色通道認證碼 | 工作人員綠色通道通行驗證 | nthu.bwy2026 |
| 1 | 環保杯與餐具 | 使用環保杯或環保餐具購買飲料或餐點一次 | ECO2026 |
| 2 | 看靜態展+許願樹 | 看靜態展+許願樹（現場驗證） | TREE2026 |
| 3 | IG 分享靜態展 | 在 IG 限動分享靜態展並標註社團 | IGEXPO2026 |
| 4 | 運動會擺攤 | 參加 11/11 運動會擺攤（現場驗證） | SPORT1111 |
| 5 | 吃一餐蔬食餐 | 吃一餐蔬食餐 | VEG2026 |
| 6 | IG 分享料理實作 | 在 IG 限動分享料理實作並標註社團 | IGCOOK2026 |
| 7 | 帶好友同行 | 帶一位朋友參加蔬食月活動（現場驗證 兩人皆可蓋） | FRIEND2026 |
| 8 | 料理實作 | 參加 11/18 料理實作（現場驗證） | COOK1118 |
| 9 | 主題社課（擇一） | 參加 10/14 前行社課或 11/25 總結社課（擇一）（現場驗證） | CLASS2026 |

---

## 時區設定（GMT+8 台灣時間）操作步驟

若 Google 試算表記錄的時間落後 8 小時（GMT+0），請依照以下步驟調整試算表設定：
1. 開啟該 Google 試算表，點選頂部選單「檔案」>「設定」。
2. 切換至「一般」分頁，將「時區」選擇為 `(GMT+08:00) 台北`。
3. 點選「儲存並重新載入」。

> 本系統後端腳本已內建 `Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm:ss")`，配合上述試算表時區設定即可達成 100% 台灣標準時間記錄。

