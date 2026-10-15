/**
 * 2026 蔬食月・跨頁面佈景主題同步模組 (assets/theme-sync.js)
 * 支援：九宮格首頁、活動報名 (form.html)、蔬食地圖 (map.html) 即時同步主題偏好
 * 特性：在 <head> 階段立即執行以避免畫面閃爍 (Zero FOUC)，並支援 localStorage 與雲端持久化。
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

  // 1. 在 DOM 渲染前立即注入 data-theme，杜絕切換頁面時的顏色跳動閃爍
  var initialTheme = getPreferredTheme();
  document.documentElement.setAttribute("data-theme", (initialTheme === "2" || initialTheme === "colorful") ? "colorful" : "simple");

  // 2. DOM 載入後更新頂部列按鈕啟用樣式
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      applyThemeDOM(getPreferredTheme());
    });
  } else {
    applyThemeDOM(getPreferredTheme());
  }

  // 3. 跨分頁 / 跨視窗即時同步監聽 (storage event)
  window.addEventListener("storage", function(e) {
    if (e.key === "veg_theme" || e.key === "veg_current_user") {
      applyThemeDOM(getPreferredTheme());
    }
  });

  // 4. 定義通用 setTheme 函式（相容無 GoogleAppsScript.js 的頁面如 form.html, map.html）
  // 若頁面已由 GoogleAppsScript.js 宣告專屬 setTheme，則保留其原生邏輯，否則以此標準實作接管
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
