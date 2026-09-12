/**
 * 清大福智青年社 社群 QR 碼模組 (方案 B)
 * 獨立封裝，支援 file:// 與 http://，零跨域限制、原生高靈敏度點擊響應
 */
(function() {
  const css = `
  /* 右下角 FAB 浮動按鈕（中窄螢幕常駐，大螢幕側欄收合後顯示） */
  .qr-fab-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9998;
    background: linear-gradient(135deg, #2e7d32, #1b5e20);
    color: #ffffff;
    border: none;
    border-radius: 50px;
    padding: 10px 18px;
    font-size: 0.9rem;
    font-weight: 700;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.25s ease;
    user-select: none;
  }
  .qr-fab-btn:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #388e3c, #2e7d32);
  }
  .qr-fab-btn .fab-icon {
    font-size: 1.15rem;
    line-height: 1;
  }

  /* 大螢幕桌面環境（≥ 1200px）：右側留白處固定側欄 */
  @media (min-width: 1200px) {
    .qr-fab-btn {
      display: none !important;
    }
    .qr-fixed-panel {
      position: fixed;
      top: 90px;
      right: 24px;
      z-index: 999;
      width: 200px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      text-align: center;
      padding: 22px 12px;
      border: 1px solid #e0e0e0;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .qr-fixed-panel .btn-close-qr {
      position: absolute;
      top: 8px;
      right: 10px;
      background: none;
      border: none;
      font-size: 1.1rem;
      color: #9e9e9e;
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
      border-radius: 4px;
    }
    .qr-fixed-panel .btn-close-qr:hover {
      color: #333333;
      background: #f5f5f5;
    }
    .qr-modal-overlay {
      display: block !important;
      position: static !important;
      background: none !important;
      padding: 0 !important;
    }
  }

  /* 中窄螢幕與手機環境（< 1200px）：隱藏側欄，改用點擊彈窗 */
  @media (max-width: 1199px) {
    .qr-fab-btn {
      display: flex !important;
    }
    .qr-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      z-index: 10000;
      display: none;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    .qr-modal-overlay.active {
      display: flex;
    }
    .qr-fixed-panel {
      position: relative;
      background: #ffffff;
      border-radius: 18px;
      width: 100%;
      max-width: 320px;
      padding: 24px 16px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: qrModalPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .qr-fixed-panel .btn-close-qr {
      position: absolute;
      top: 10px;
      right: 12px;
      background: #f0f0f0;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 1rem;
      color: #666666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-fixed-panel .btn-close-qr:hover {
      background: #e0e0e0;
      color: #000000;
    }
  }

  @keyframes qrModalPop {
    0% { opacity: 0; transform: scale(0.85); }
    100% { opacity: 1; transform: scale(1); }
  }

  /* 面板內部細節樣式 */
  .qr-fixed-panel .title {
    font-size: 1.05rem;
    margin-bottom: 16px;
    color: #1b5e20;
    font-weight: 700;
  }
  .qr-fixed-panel .qr-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .qr-fixed-panel .qr-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .qr-fixed-panel .qr-item img {
    width: 130px;
    height: 130px;
    border-radius: 10px;
    margin-bottom: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
  }
  .qr-fixed-panel .qr-item img:hover {
    transform: scale(1.04);
  }
  .qr-fixed-panel .label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #263238;
  }
  .qr-fixed-panel .account a {
    font-size: 0.85rem;
    color: #2e7d32;
    text-decoration: none;
    font-weight: 500;
  }
  .qr-fixed-panel .account a:hover {
    text-decoration: underline;
  }
  `;

  const html = `
  <button type="button" id="qrFabBtn" class="qr-fab-btn" onclick="openQrModal()">
    <span class="fab-icon">🌱</span>
    <span>追蹤按讚</span>
  </button>

  <div id="qrModalOverlay" class="qr-modal-overlay" onclick="handleQrOverlayClick(event)">
    <div id="qrFixedPanel" class="qr-fixed-panel" onclick="event.stopPropagation()">
      <button type="button" class="btn-close-qr" onclick="closeQrModal()" title="關閉">✕</button>
      <div class="title">歡迎追蹤按讚！</div>
      <div class="qr-row">
        <div class="qr-item">
          <a href="https://www.instagram.com/bwyouthhc.nthu/" target="_blank">
            <img src="img/bwy.nthu_IG.png" alt="IG QR碼">
          </a>
          <div class="label">Instagram</div>
          <div class="account">
            <a href="https://www.instagram.com/bwyouthhc.nthu/" target="_blank">@bwyouthhc.nthu</a>
          </div>
        </div>
        <div class="qr-item">
          <a href="https://www.facebook.com/blisswisdom.nthu" target="_blank">
            <img src="img/bwy.nthu_FB.png" alt="FB QR碼">
          </a>
          <div class="label">Facebook</div>
          <div class="account">
            <a href="https://www.facebook.com/blisswisdom.nthu" target="_blank">清大福智青年社</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  function init() {
    const styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    const div = document.createElement("div");
    div.id = "qrFixedModuleWrapper";
    div.innerHTML = html;
    document.body.appendChild(div);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.openQrModal = function() {
    const overlay = document.getElementById("qrModalOverlay");
    const panel = document.getElementById("qrFixedPanel");
    if (window.innerWidth >= 1200) {
      if (panel) panel.style.display = "block";
      const fab = document.getElementById("qrFabBtn");
      if (fab) fab.style.display = "none";
    } else {
      if (overlay) overlay.classList.add("active");
    }
  };

  window.closeQrModal = function() {
    const overlay = document.getElementById("qrModalOverlay");
    if (overlay) overlay.classList.remove("active");

    if (window.innerWidth >= 1200) {
      const panel = document.getElementById("qrFixedPanel");
      const fab = document.getElementById("qrFabBtn");
      if (panel) panel.style.display = "none";
      if (fab) fab.style.display = "flex";
    }
  };

  window.handleQrOverlayClick = function(e) {
    if (e.target.id === "qrModalOverlay") {
      closeQrModal();
    }
  };

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      closeQrModal();
    }
  });
})();
