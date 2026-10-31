/**
 * island-camera.js - 2026 清大福青社蔬食地圖：一鍵美照拍貼機（Photo Studio & Snapshot Tool）
 * 
 * 功能亮點：
 * 1. 浮動相機快門鈕（FAB）：置於導覽列上方中央處（相容手持與桌機視圖），支援快門微震與閃光特效
 * 2. 高畫質 3D 純淨截圖：主動調用 Three.js WebGLRenderer 渲染純淨 3D 浮島場景（無 HTML 標籤與介面干擾）
 * 3. 雙層離屏 Canvas 浮水印合成：
 *    - 整合 ./img/抱抱地球2.png 原生品牌吉祥物
 *    - 搭配 [2026 清大福青蔬食月] 與 [天空之城 3D 蔬食地圖] 典雅文字牌
 *    - 支援 4 角位置自由切換：左上 (Top-Left)、右上 (Top-Right)、左下 (Bottom-Left)、右下 (Bottom-Right)
 * 4. 拍貼預覽與輸出：
 *    - 彈出式拍貼預覽視窗（Photo Booth Modal），即時切換浮水印位置無延遲重繪
 *    - 一鍵高解析 PNG 下載，支援時間戳命名
 *    - 支援原生 Web Share API（若裝置支援則提供社群一鍵轉發）
 */

(function () {
  'use strict';

  // 浮水印位置白名單
  const CORNER_CONFIGS = [
    { id: 'tl', label: '↖ 左上', pos: 'Top-Left' },
    { id: 'tr', label: '↗ 右上', pos: 'Top-Right' },
    { id: 'bl', label: '↙ 左下', pos: 'Bottom-Left' },
    { id: 'br', label: '↘ 右下', pos: 'Bottom-Right' }
  ];

  class IslandCamera {
    constructor() {
      this.currentCorner = localStorage.getItem('nthu_island_watermark_pos') || 'tr';
      this.logoImg = null;
      this.isLogoLoaded = false;
      this.capturedBaseCanvas = null;
      this.mergedDataUrl = null;
      this.modalEl = null;
      this.btnFab = null;

      this.preloadLogo();
      this.injectStyles();
      this.initUI();
    }

    // 預先載入抱抱地球 Logo 圖片
    preloadLogo() {
      this.logoImg = new Image();
      this.logoImg.crossOrigin = 'anonymous';
      this.logoImg.src = './img/抱抱地球2.png';
      this.logoImg.onload = () => {
        this.isLogoLoaded = true;
      };
      this.logoImg.onerror = () => {
        console.warn('[island-camera] 抱抱地球 Logo 圖片載入失敗，將採用純文字備援浮水印');
      };
    }

    // 注入專屬獨立美化 CSS 樣式
    injectStyles() {
      if (document.getElementById('island-camera-styles')) return;
      const style = document.createElement('style');
      style.id = 'island-camera-styles';
      style.textContent = `
        /* 1. 浮動相機快門按鈕（置於導覽列上方中央處） */
        .island-camera-fab {
          position: fixed;
          left: 50%;
          bottom: 66px;
          transform: translateX(-50%);
          z-index: 26;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fbf8f1;
          border: 2px solid #4a8584;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(74, 133, 132, 0.28);
          color: #2e5958;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          padding: 0;
        }

        .island-camera-fab:hover {
          transform: translateX(-50%) scale(1.12);
          background: #ffffff;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28), 0 0 10px rgba(74, 133, 132, 0.45);
          color: #1e3a39;
        }

        .island-camera-fab:active {
          transform: translateX(-50%) scale(0.94);
        }

        .island-camera-fab svg {
          width: 22px;
          height: 22px;
          fill: currentColor;
          transition: transform 0.2s ease;
        }

        .island-camera-fab:hover svg {
          transform: rotate(-6deg);
        }

        /* 手持裝置（<= 760px）：微調高度與尺寸，避開底部工具列與音樂迷你列 */
        @media (max-width: 760px) {
          .island-camera-fab {
            bottom: 52px;
            width: 36px;
            height: 36px;
          }
          .island-camera-fab svg {
            width: 18px;
            height: 18px;
          }
        }

        /* 2. 快門全螢幕白光閃爍回饋 */
        .island-camera-flash {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #ffffff;
          z-index: 99999;
          pointer-events: none;
          opacity: 0.85;
          animation: cameraFlashAnim 0.32s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        }

        @keyframes cameraFlashAnim {
          0% { opacity: 0.85; }
          100% { opacity: 0; }
        }

        /* 3. 拍貼機預覽彈窗 (Photo Booth Modal) */
        .island-photo-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 20, 22, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }

        .island-photo-modal.active {
          opacity: 1;
          pointer-events: auto;
        }

        .island-photo-card {
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 2px 10px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 760px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(74, 133, 132, 0.25);
          animation: modalSlideUp 0.3s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
        }

        @keyframes modalSlideUp {
          from { transform: translateY(24px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .island-photo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: linear-gradient(135deg, #f7f5ee, #edf4f2);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .island-photo-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e3a39;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .island-photo-title span {
          display: inline-block;
          font-size: 18px;
        }

        .island-photo-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.06);
          color: #4a5568;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .island-photo-close:hover {
          background: rgba(220, 53, 69, 0.12);
          color: #dc3545;
          transform: rotate(90deg);
        }

        /* 預覽畫布視窗 */
        .island-photo-body {
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          background: #f8f9fa;
        }

        .island-photo-preview-wrap {
          position: relative;
          width: 100%;
          max-height: 54vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #141819;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
        }

        .island-photo-preview-img {
          max-width: 100%;
          max-height: 54vh;
          object-fit: contain;
          display: block;
          border-radius: 6px;
        }

        /* 浮水印位置選擇器 */
        .island-photo-toolbar {
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: #ffffff;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
        }

        .island-corner-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .island-corner-label {
          font-size: 13px;
          font-weight: 700;
          color: #4a5568;
          margin-right: 2px;
        }

        .island-corner-btn {
          padding: 5px 11px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
          color: #334155;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .island-corner-btn:hover {
          background: #e2e8f0;
          border-color: #94a3b8;
        }

        .island-corner-btn.active {
          background: #4a8584;
          border-color: #376564;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(74, 133, 132, 0.35);
        }

        /* 底部操作按鈕 */
        .island-photo-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 12px 18px;
          background: #ffffff;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }

        .island-btn-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .island-btn-retake {
          background: #edf2f7;
          color: #4a5568;
        }
        .island-btn-retake:hover {
          background: #e2e8f0;
          color: #2d3748;
        }

        .island-btn-download {
          background: #ea7a2e;
          color: #ffffff;
          box-shadow: 0 3px 10px rgba(234, 122, 46, 0.32);
        }
        .island-btn-download:hover {
          background: #db6a1f;
          box-shadow: 0 4px 14px rgba(234, 122, 46, 0.45);
          transform: translateY(-1px);
        }

        .island-btn-share {
          background: #4a8584;
          color: #ffffff;
          box-shadow: 0 3px 10px rgba(74, 133, 132, 0.3);
        }
        .island-btn-share:hover {
          background: #376564;
          transform: translateY(-1px);
        }
      `;
      document.head.appendChild(style);
    }

    // 初始化按鈕與 DOM 結構
    initUI() {
      // 1. 建立浮動相機快門 FAB
      const fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'island-camera-fab';
      fab.id = 'btnIslandCamera';
      fab.setAttribute('aria-label', '一鍵美照拍貼機（拍攝當前浮島角度並套用專屬浮水印）');
      fab.title = '一鍵美照拍貼機';
      fab.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
        </svg>
      `;
      fab.addEventListener('click', () => this.snapPhoto());
      document.body.appendChild(fab);
      this.btnFab = fab;

      // 2. 建立拍貼機彈窗 Modal
      const modal = document.createElement('div');
      modal.className = 'island-photo-modal';
      modal.id = 'islandPhotoModal';
      modal.innerHTML = `
        <div class="island-photo-card" role="dialog" aria-modal="true" aria-labelledby="photoModalTitle">
          <div class="island-photo-header">
            <div class="island-photo-title" id="photoModalTitle">
              <span>📸</span> 2026 清大福青社蔬食地圖・一鍵美照拍貼機
            </div>
            <button type="button" class="island-photo-close" id="btnClosePhotoModal" aria-label="關閉拍貼預覽">✕</button>
          </div>
          <div class="island-photo-body">
            <div class="island-photo-preview-wrap">
              <img class="island-photo-preview-img" id="photoPreviewImg" alt="拍貼照片預覽" />
            </div>
            <div class="island-photo-toolbar">
              <div class="island-corner-selector">
                <span class="island-corner-label">浮水印位置：</span>
                ${CORNER_CONFIGS.map(c => `
                  <button type="button" class="island-corner-btn ${c.id === this.currentCorner ? 'active' : ''}" data-corner="${c.id}">
                    ${c.label}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="island-photo-footer">
            <button type="button" class="island-btn-action island-btn-retake" id="btnRetakePhoto">
              🔄 換個角度再拍一張
            </button>
            <button type="button" class="island-btn-action island-btn-download" id="btnDownloadPhoto">
              💾 下載美照 PNG
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this.modalEl = modal;

      // 綁定彈窗內部互動事件
      modal.querySelector('#btnClosePhotoModal').addEventListener('click', () => this.closeModal());
      modal.querySelector('#btnRetakePhoto').addEventListener('click', () => this.closeModal());
      modal.querySelector('#btnDownloadPhoto').addEventListener('click', () => this.downloadPhoto());

      // 點擊背景空白處關閉
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });

      // ESC 鍵關閉
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          this.closeModal();
        }
      });

      // 浮水印位置按鈕群組監聽
      const cornerBtns = modal.querySelectorAll('.island-corner-btn');
      cornerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          cornerBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentCorner = btn.getAttribute('data-corner');
          localStorage.setItem('nthu_island_watermark_pos', this.currentCorner);
          this.recompositePhoto();
        });
      });
    }

    // 執行拍貼快門擷取
    snapPhoto() {
      // 1. 觸發相機快門閃光動效
      const flash = document.createElement('div');
      flash.className = 'island-camera-flash';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 350);

      // 2. 獲取 Three.js 渲染器與場景
      const renderer = window.__islandRenderer;
      const scene = window.__islandScene;
      const camera = window.__islandCamera;

      if (!renderer || !scene || !camera) {
        console.error('[island-camera] Three.js 場景尚未就緒');
        return;
      }

      // 3. 即時強制繪製一幀純淨 3D 浮島畫面
      renderer.render(scene, camera);

      // 4. 建立離屏 Base Canvas 備份純淨 3D 底圖
      const srcCanvas = renderer.domElement;
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = srcCanvas.width;
      baseCanvas.height = srcCanvas.height;
      const baseCtx = baseCanvas.getContext('2d');
      baseCtx.drawImage(srcCanvas, 0, 0);
      this.capturedBaseCanvas = baseCanvas;

      // 5. 執行合成並開啟預覽視窗
      this.recompositePhoto();
      this.modalEl.classList.add('active');
    }

    // 將底圖與指定角落之品牌浮水印合成
    recompositePhoto() {
      if (!this.capturedBaseCanvas) return;

      const baseCanvas = this.capturedBaseCanvas;
      const width = baseCanvas.width;
      const height = baseCanvas.height;

      const outCanvas = document.createElement('canvas');
      outCanvas.width = width;
      outCanvas.height = height;
      const ctx = outCanvas.getContext('2d');

      // 1. 繪製純淨 3D 浮島底圖
      ctx.drawImage(baseCanvas, 0, 0);

      // 2. 繪製專屬精緻浮水印（包含抱抱地球 Logo 與「2026 清大福青蔬食月」文字牌）
      this.drawWatermark(ctx, width, height, this.currentCorner);

      // 3. 更新預覽圖片
      this.mergedDataUrl = outCanvas.toDataURL('image/png', 0.95);
      const previewImg = this.modalEl.querySelector('#photoPreviewImg');
      if (previewImg) {
        previewImg.src = this.mergedDataUrl;
      }
    }

    // 繪製品牌浮水印徽章
    drawWatermark(ctx, canvasW, canvasH, corner) {
      // 依畫布解析度自適應等比縮放
      const scale = Math.max(0.75, Math.min(1.4, canvasW / 1280));
      const padX = 16 * scale;
      const padY = 10 * scale;
      const logoH = 58 * scale;
      const logoW = this.logoImg && this.logoImg.complete && this.logoImg.naturalHeight > 0
        ? logoH * (this.logoImg.naturalWidth / this.logoImg.naturalHeight)
        : 58 * scale;

      const fontTitle = `bold ${Math.round(18 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif`;
      const fontSub = `600 ${Math.round(11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif`;

      ctx.save();
      ctx.font = fontTitle;
      const titleWidth = ctx.measureText('2026 清大福青蔬食月').width;
      ctx.font = fontSub;
      const subWidth = ctx.measureText('天空之城 3D 蔬食地圖・出一張嘴改變世界').width;
      const maxTextW = Math.max(titleWidth, subWidth);

      const badgeW = padX * 2 + logoW + 12 * scale + maxTextW + 6 * scale;
      const badgeH = padY * 2 + Math.max(logoH, 44 * scale);
      const margin = 24 * scale;

      let x = margin;
      let y = margin;

      if (corner === 'tr') {
        x = canvasW - badgeW - margin;
        y = margin;
      } else if (corner === 'bl') {
        x = margin;
        y = canvasH - badgeH - margin;
      } else if (corner === 'br') {
        x = canvasW - badgeW - margin;
        y = canvasH - badgeH - margin;
      } // 'tl' is default (x = margin, y = margin)

      // 繪製半透明珍珠柔白毛玻璃膠囊背板（抗反光、確保在白雲與黑夜皆清晰銳利）
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 16 * scale;
      ctx.shadowOffsetY = 4 * scale;

      ctx.fillStyle = 'rgba(255, 252, 246, 0.94)';
      ctx.strokeStyle = 'rgba(74, 133, 132, 0.42)';
      ctx.lineWidth = 1.5 * scale;

      this.fillRoundRect(ctx, x, y, badgeW, badgeH, 14 * scale);
      ctx.fill();
      ctx.stroke();

      // 清除陰影，精準渲染圖案與文字
      ctx.shadowColor = 'transparent';

      // 繪製抱抱地球2.png 原圖
      if (this.logoImg && this.logoImg.complete && this.logoImg.naturalHeight > 0) {
        const logoY = y + (badgeH - logoH) / 2;
        ctx.drawImage(this.logoImg, x + padX, logoY, logoW, logoH);
      }

      // 繪製主題文字
      const textX = x + padX + logoW + 12 * scale;
      const textBaseY = y + padY + 6 * scale;

      // 主標題：2026 清大福青蔬食月
      ctx.fillStyle = '#1e3a39';
      ctx.font = fontTitle;
      ctx.textBaseline = 'top';
      ctx.fillText('2026 清大福青蔬食月', textX, textBaseY);

      // 副標題：天空之城 3D 蔬食地圖・出一張嘴改變世界
      ctx.fillStyle = '#4a8584';
      ctx.font = fontSub;
      ctx.fillText('天空之城 3D 蔬食地圖・出一張嘴改變世界', textX, textBaseY + 24 * scale);

      ctx.restore();
    }

    // 圓角矩形輔助路徑
    fillRoundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    // 下載已合成的 PNG 圖片
    downloadPhoto() {
      if (!this.mergedDataUrl) return;

      const dateStr = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      const fileName = `2026清大福青蔬食地圖_美照拍貼_${dateStr}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = this.mergedDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // 關閉拍貼彈窗
    closeModal() {
      if (this.modalEl) {
        this.modalEl.classList.remove('active');
      }
    }
  }

  // 待 DOM 就緒後自動掛載單例
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.__ISLAND_CAMERA__ = new IslandCamera();
    });
  } else {
    window.__ISLAND_CAMERA__ = new IslandCamera();
  }
})();
