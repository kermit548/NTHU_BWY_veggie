/**
 * 2026 蔬食月・跨頁面佈景主題與工作人員狀態同步模組 (assets/theme-sync.js)
 * 支援：九宮格首頁、活動報名 (form.html)、蔬食地圖 (map.html)、排班時段 (schedule.html)
 * 特性：在 <head> 階段立即執行以避免畫面閃爍 (Zero FOUC)，支援 localStorage 狀態與漢堡選單互動。
 */
(function() {
  function getPreferredTheme() {
    try {
      var userStr = localStorage.getItem("veg_current_user");
      if (userStr) {
        var user = JSON.parse(userStr);
        if (user && user.theme !== undefined && user.theme !== null) {
          return String(user.theme);
        }
      }
      return localStorage.getItem("veg_theme") || "1";
    } catch(e) {
      return localStorage.getItem("veg_theme") || "1";
    }
  }

  function applyThemeDOM(themeVal) {
    var valStr = String(themeVal || "").trim();
    var isColorful = (valStr === "2" || valStr === "colorful");
    var themeName = isColorful ? "colorful" : "simple";
    var themeCode = isColorful ? "2" : "1";

    document.documentElement.setAttribute("data-theme", themeName);
    
    var btnSimple = document.getElementById("btnThemeSimple");
    var btnColorful = document.getElementById("btnThemeColorful");
    if (btnSimple && btnColorful) {
      if (isColorful) {
        btnSimple.classList.remove("active");
        btnColorful.classList.add("active");
      } else {
        btnSimple.classList.add("active");
        btnColorful.classList.remove("active");
      }
    }
    return { themeName: themeName, themeCode: themeCode, isColorful: isColorful };
  }

  // 工作人員狀態同步函式
  function syncStaffModeDOM() {
    try {
      var isStaff = (localStorage.getItem("veg_is_staff") === "1");
      if (isStaff) {
        document.documentElement.classList.add("staff-active");
      } else {
        document.documentElement.classList.remove("staff-active");
      }

      var indicator = document.getElementById("staffIndicator");
      if (indicator) {
        indicator.style.display = isStaff ? "inline-block" : "none";
      }

      var toggleBtn = document.getElementById("btnStaffToggle");
      if (toggleBtn) {
        var isEn = (document.documentElement.lang === "en" || window.location.pathname.indexOf("_en") !== -1);
        if (isStaff) {
          toggleBtn.innerText = isEn ? "Normal mode" : "切換回一般人員模式";
          toggleBtn.classList.add("btn-staff-active");
        } else {
          toggleBtn.innerText = isEn ? "Staff Mode" : "切換為工作人員身份";
          toggleBtn.classList.remove("btn-staff-active");
        }
      }
    } catch(e) {}
  }
  window.syncStaffModeDOM = syncStaffModeDOM;

  // 1. 在 DOM 渲染前立即注入 data-theme 與 staff-active，杜絕切換頁面時的跳動閃爍
  var initialTheme = getPreferredTheme();
  document.documentElement.setAttribute("data-theme", (initialTheme === "2" || initialTheme === "colorful") ? "colorful" : "simple");
  try {
    if (localStorage.getItem("veg_is_staff") === "1") {
      document.documentElement.classList.add("staff-active");
    } else {
      document.documentElement.classList.remove("staff-active");
    }
  } catch(e) {}

  // 2. DOM 載入後更新頂部列按鈕啟用樣式與工作人員指示器
  function onDOMLoaded() {
    applyThemeDOM(getPreferredTheme());
    syncStaffModeDOM();

    // 點擊漢堡選單內的任一連結時自動收合選單
    var navLinks = document.querySelectorAll(".header-nav a");
    navLinks.forEach(function(link) {
      link.addEventListener("click", function() {
        var nav = document.querySelector(".header-nav");
        var btn = document.getElementById("btnHamburger");
        if (nav && nav.classList.contains("nav-open")) {
          nav.classList.remove("nav-open");
          if (btn) btn.classList.remove("is-active");
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDOMLoaded);
  } else {
    onDOMLoaded();
  }

  // 3. 跨分頁 / 跨視窗即時同步監聽 (storage event)
  window.addEventListener("storage", function(e) {
    if (e.key === "veg_theme" || e.key === "veg_current_user") {
      applyThemeDOM(getPreferredTheme());
    }
    if (e.key === "veg_is_staff") {
      syncStaffModeDOM();
    }
  });

  // 4. 定義通用漢堡選單切換函式
  window.toggleMobileNav = function(e) {
    if (e) {
      e.stopPropagation();
    }
    var nav = document.querySelector(".header-nav");
    var btn = document.getElementById("btnHamburger");
    if (nav) {
      var isOpen = nav.classList.toggle("nav-open");
      if (btn) {
        btn.classList.toggle("is-active", isOpen);
      }
    }
  };

  // 5. 點擊選單外部自動關閉漢堡選單
  document.addEventListener("click", function(e) {
    var nav = document.querySelector(".header-nav");
    var btn = document.getElementById("btnHamburger");
    if (nav && nav.classList.contains("nav-open")) {
      if (!nav.contains(e.target) && (!btn || !btn.contains(e.target))) {
        nav.classList.remove("nav-open");
        if (btn) btn.classList.remove("is-active");
      }
    }
  });

  // 6. 定義通用 setTheme 函式（相容無 GoogleAppsScript.js 的頁面如 form.html, map.html, schedule.html）
  if (!window.setTheme) {
    window.setTheme = function(themeVal) {
      var res = applyThemeDOM(themeVal);
      localStorage.setItem("veg_theme", res.themeCode);

      try {
        var userStr = localStorage.getItem("veg_current_user");
        if (userStr) {
          var user = JSON.parse(userStr);
          user.theme = res.isColorful ? 2 : 1;
          localStorage.setItem("veg_current_user", JSON.stringify(user));

          // 若具備雲端同步網址與卡號，同步回寫至試算表
          var gasUrl = (typeof GOOGLE_APPS_SCRIPT_URL !== "undefined" && GOOGLE_APPS_SCRIPT_URL)
            ? GOOGLE_APPS_SCRIPT_URL
            : (localStorage.getItem("veg_gas_api_url") || "");
          if (gasUrl && user.serial) {
            fetch(gasUrl + "?action=setTheme&serial=" + encodeURIComponent(user.serial) + "&theme=" + user.theme + "&t=" + Date.now()).catch(function(){});
          }
        }
      } catch(e) {}

      // 簡易提示
      if (typeof showToast === "function") {
        showToast(res.isColorful ? "已切換為【鮮豔】主題" : "已切換為【淡雅】主題");
      }
    };
  }
})();
