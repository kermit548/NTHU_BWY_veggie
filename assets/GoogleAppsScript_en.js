// 2026 Veggie Month Google Apps Script Web App Config (English)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwms3Fo0wJO7Dw7grjZBDYcUwxuORhCcxb1G8A3pKcLI8l0BfU40Ao4mVWwJWkrmzAH1g/exec";

/* ==========================================================================
 * 2026 Veggie Month ・ Green Bingo Challenge (English Interaction Module)
 * ========================================================================== */

// Default Fallback Tasks (English)
const DEFAULT_TASKS_EN = [
  { id: 1, title: "Eco Cup & Tableware", desc: "Use your own reusable cup or tableware when buying food/drinks once", code: "ECO01" },
  { id: 2, title: "Visit Exhibition & Wish Tree", desc: "Visit the static exhibition and write a wish card on the Wish Tree", code: "TREE02" },
  { id: 3, title: "Share Exhibition on IG", desc: "Share the exhibition on IG Story and tag @nthu_bwy", code: "IGPO03" },
  { id: 4, title: "Sports Day Booth", desc: "Join and participate at our Sports Day booth on 11/11", code: "SPORT04" },
  { id: 5, title: "Have a Plant-Based Meal", desc: "Enjoy a delicious vegetarian/vegan meal (Core Task)", code: "VEG2026" },
  { id: 6, title: "Share Cooking on IG", desc: "Share cooking workshop photos/videos on IG Story and tag @nthu_bwy", code: "REELS06" },
  { id: 7, title: "Bring a Friend Along", desc: "Bring a friend to join the Veggie Month activities (both get stamped)", code: "FRIEND07" },
  { id: 8, title: "Veggie Cooking Workshop", desc: "Join the hands-on vegetarian cooking workshop on 11/18", code: "COOK08" },
  { id: 9, title: "Featured Club Class (Choose 1)", desc: "Attend either the intro class on 10/14 or wrap-up class on 11/25", code: "CLASS09" }
];

function getInitialTasks() {
  try {
    const cached = JSON.parse(localStorage.getItem("veg_tasks_cache_en") || "null");
    if (cached && Array.isArray(cached) && cached.length === 9) {
      return cached;
    }
  } catch(e) {
    console.warn(e);
  }
  return DEFAULT_TASKS_EN;
}

let TASKS_DEF = getInitialTasks();
let sessionStaffCode = "";

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
    const endpointInput = document.getElementById("gasEndpoint");
    if (endpointInput) endpointInput.value = gasApiUrl;
    fetchTasksFromCloud();
    if (currentUser && currentUser.serial) {
      syncCardWithCloud(currentUser.serial, true);
    }
  }
});

function showToast(msg, duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) return;
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

// Toggle Staff Mode
function toggleStaffMode() {
  if (!isStaffMode) {
    const input = prompt("Please enter Staff Passcode to activate Fast-Track:");
    if (input === null) return;
    const cleanInput = input.trim();
    if (!cleanInput) {
      alert("Passcode cannot be empty!");
      return;
    }
    sessionStaffCode = cleanInput;
    isStaffMode = true;
    document.getElementById("staffIndicator").style.display = "inline-block";
    showToast("Staff Mode Activated (Fast-track ready)");
  } else {
    isStaffMode = false;
    sessionStaffCode = "";
    document.getElementById("staffIndicator").style.display = "none";
    showToast("Switched back to Participant Mode");
  }
}

// Fetch tasks dynamically from Google Sheets
async function fetchTasksFromCloud(quiet = true) {
  if (!gasApiUrl) return;
  try {
    const resp = await fetch(`${gasApiUrl}?action=getTasks&t=${Date.now()}`);
    const res = await resp.json();
    
    if (res.success && Array.isArray(res.tasks) && res.tasks.length === 9) {
      TASKS_DEF = res.tasks.map((t, i) => {
        const fallback = DEFAULT_TASKS_EN[i] || {};
        return {
          id: t.id || i + 1,
          title: t.titleEn || fallback.title || t.title,
          desc: t.descEn || fallback.desc || t.desc,
          code: t.code || fallback.code || ""
        };
      });
      localStorage.setItem("veg_tasks_cache_en", JSON.stringify(TASKS_DEF));
      if (currentUser) {
        renderBingoCard();
      }
      if (!quiet) {
        showToast("Tasks synchronized with Google Sheets!");
      }
    }
  } catch (err) {
    console.warn("Using offline English fallback tasks", err);
  }
}

// Sync card progress with Google Sheets
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
        showToast("Fully synchronized with Google Sheets!");
      }
    }
  } catch (e) {
    console.warn("Background sync failed", e);
  }
}

// Test Connection
async function testConnection() {
  const url = gasApiUrl;
  const box = document.getElementById("testResultBox");
  if (!url) {
    box.style.display = "block";
    box.style.background = "#ffebee";
    box.style.color = "#c62828";
    box.innerText = "Web App URL not found. Please verify GoogleAppsScript_en.js.";
    return;
  }

  box.style.display = "block";
  box.style.background = "#e3f2fd";
  box.style.color = "#1565c0";
  box.innerText = "Sending test request to Google Apps Script...";

  try {
    const resp = await fetch(`${url}?action=test&t=${Date.now()}`);
    const text = await resp.text();
    let res;
    try {
      res = JSON.parse(text);
    } catch (parseErr) {
      box.style.background = "#ffebee";
      box.style.color = "#c62828";
      box.innerHTML = `<strong>Connection Error (Non-JSON response)</strong><br>Received HTML content (possibly Google Login screen).<br><strong>Solution:</strong> Ensure Web App deployment access is set to "Anyone".`;
      return;
    }

    if (res.success) {
      box.style.background = "#e8f5e9";
      box.style.color = "#2e7d32";
      box.innerHTML = `<strong>Connection Successful!</strong><br>${res.message || "API online"}<br>Sheet: ${res.sheetName || "Database"} (${res.totalRows || 0} rows)<br>Tasks: ${res.tasksCount || 0} items<br>Staff Fast-Track: Configured`;
    } else {
      box.style.background = "#fff3e0";
      box.style.color = "#e65100";
      box.innerHTML = `<strong>Backend Error:</strong> ${res.error || res.message}`;
    }
  } catch (netErr) {
    box.style.background = "#ffebee";
    box.style.color = "#c62828";
    box.innerHTML = `<strong>Connection Failed:</strong> ${netErr.message}<br>Check your network or ensure Web App access is set to "Anyone".`;
  }
}

function generateSerial() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `VEG-2026-${num}`;
}

// Handle Register
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const studentId = document.getElementById("regStudentId").value.trim();
  const contact = document.getElementById("regContact").value.trim();

  if (!name || !studentId || !contact) {
    alert("Please fill in all required fields.");
    return;
  }

  const submitBtn = document.getElementById("btnSubmitReg");
  submitBtn.disabled = true;
  submitBtn.innerText = "Registering...";

  const serial = generateSerial();
  const newUser = {
    serial: serial,
    name: name,
    studentId: studentId,
    contact: contact,
    stamps: [0, 0, 0, 0, 0, 0, 0, 0, 0],
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
      showToast("Registered and synchronized with Google Sheets!");
    } catch (err) {
      console.warn("Failed to sync with GAS, switching to local mode", err);
    }
  }

  currentUser = newUser;
  saveCurrentUserData();
  
  closeModal("registerModal");
  submitBtn.disabled = false;
  submitBtn.innerText = "Complete Registration & Get Bingo Card";

  renderBingoCard();
  showToast(`Welcome! Your Card Serial No. is: ${serial}`);
}

// Handle Lookup
async function handleLookup(e) {
  e.preventDefault();
  const serial = document.getElementById("lookupSerial").value.trim();
  if (!serial) return;

  const submitBtn = document.getElementById("btnSubmitLookup");
  submitBtn.disabled = true;
  submitBtn.innerText = "Searching...";

  if (gasApiUrl) {
    showToast("Retrieving latest card progress from Google Sheets...");
    try {
      const fetchUrl = `${gasApiUrl}?action=getCard&serial=${encodeURIComponent(serial)}&t=${Date.now()}`;
      const resp = await fetch(fetchUrl);
      const text = await resp.text();
      
      let res;
      try {
        res = JSON.parse(text);
      } catch (pErr) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Search Card";
        alert("Connection Error: Unable to parse JSON response. Ensure Web App access is set to 'Anyone'.");
        return;
      }

      if (res.success && res.data) {
        currentUser = res.data;
        saveCurrentUserData();
        closeModal("lookupModal");
        submitBtn.disabled = false;
        submitBtn.innerText = "Search Card";
        renderBingoCard();
        showToast("Synchronized latest progress from Google Sheets!");
        return;
      } else {
        submitBtn.disabled = false;
        submitBtn.innerText = "Search Card";
        alert(`【Search Failed】${res.message || "Serial number not found."}`);
        return;
      }
    } catch (err) {
      console.warn("Cloud lookup failed, fallback to local storage", err);
    }
  }

  const local = localStorage.getItem("veg_user_" + serial);
  if (local) {
    currentUser = JSON.parse(local);
    saveCurrentUserData();
    closeModal("lookupModal");
    submitBtn.disabled = false;
    submitBtn.innerText = "Search Card";
    renderBingoCard();
    showToast("(Offline Mode) Loaded local cached progress!");
    return;
  }

  submitBtn.disabled = false;
  submitBtn.innerText = "Search Card";
  alert("Serial number not found!
Please verify your number or contact the staff booth.");
}

function saveCurrentUserData() {
  if (!currentUser) return;
  localStorage.setItem("veg_current_user", JSON.stringify(currentUser));
  localStorage.setItem("veg_user_" + currentUser.serial, JSON.stringify(currentUser));
}

function resetCurrentCard() {
  if (confirm("Are you sure you want to switch cards? Your progress is saved with your serial number.")) {
    currentUser = null;
    localStorage.removeItem("veg_current_user");
    document.getElementById("heroCard").style.display = "block";
    document.getElementById("bingoSection").style.display = "none";
    showToast("Returned to home page");
  }
}

// Render Bingo Card
function renderBingoCard() {
  if (!currentUser) return;

  document.getElementById("heroCard").style.display = "none";
  document.getElementById("bingoSection").style.display = "block";

  document.getElementById("metaSerial").innerText = currentUser.serial;
  document.getElementById("metaName").innerText = currentUser.name;

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
      <div class="cell-number">#${idx + 1} ${isCenter ? "★ Core Task" : ""}</div>
      <div class="cell-title">${task.title}</div>
      <div class="cell-desc">${task.desc}</div>
      <div class="cell-status-hint">${isStamped ? "Stamped" : "Click to Stamp →"}</div>
      <img class="stamp-mark" src="./img/抱抱地球2.png" alt="Stamped">
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
    showToast(`【Task #${idx + 1}: ${task.title}】has already been stamped!`);
    return;
  }

  document.getElementById("stampGridIndex").value = idx;
  document.getElementById("stampModalTitle").innerText = `Stamp Task: #${idx + 1} ${task.title}`;
  document.getElementById("stampModalDesc").innerText = `${task.desc}`;
  document.getElementById("verifyCode").value = "";

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
    alert("Passcode error! Please check with the booth staff.");
    return;
  }

  confirmStamp(false);
}

// Confirm Stamp
async function confirmStamp(isBypass) {
  const idx = parseInt(document.getElementById("stampGridIndex").value, 10);
  
  const btnStaff = document.querySelector("#staffQuickSection button");
  const btnSubmit = document.querySelector("#stampModal button[type='submit']");
  if (btnStaff) { btnStaff.disabled = true; btnStaff.innerText = "Writing to Sheets..."; }
  if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = "Stamping..."; }
  showToast("Saving stamp to Google Sheets...");

  if (gasApiUrl) {
    try {
      const stampUrl = `${gasApiUrl}?action=stamp&serial=${encodeURIComponent(currentUser.serial)}&gridIndex=${idx}&isStaffOverride=${isBypass}&staffPasscode=${encodeURIComponent(isBypass ? sessionStaffCode : "")}&t=${Date.now()}`;
      const resp = await fetch(stampUrl);
      const res = await resp.json();
      
      if (!res.success) {
        alert(`【Cloud Error】${res.message || res.error}
Please try again.`);
        if (btnStaff) { btnStaff.disabled = false; btnStaff.innerText = "Staff Fast-Track Stamp"; }
        if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "Verify & Stamp"; }
        return;
      }
    } catch (err) {
      console.error("GAS stamp request failed", err);
      const goLocal = confirm(`Network error while writing to Google Sheets:
${err.message}

Do you want to stamp locally for now?`);
      if (!goLocal) {
        if (btnStaff) { btnStaff.disabled = false; btnStaff.innerText = "Staff Fast-Track Stamp"; }
        if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "Verify & Stamp"; }
        return;
      }
    }
  }

  currentUser.stamps[idx] = 1;
  saveCurrentUserData();

  if (btnStaff) { btnStaff.disabled = false; btnStaff.innerText = "Staff Fast-Track Stamp"; }
  if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "Verify & Stamp"; }

  closeModal("stampModal");
  renderBingoCard();

  const lines = calculateBingoLines(currentUser.stamps);
  if (lines.count > 0) {
    showToast(`Congratulations! Task #${idx + 1} stamped! Total lines: ${lines.count}!`);
  } else {
    showToast(`Task #${idx + 1} successfully stamped!`);
  }
}

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
