// 2026 清大福青社蔬食地圖 — HUD 互動介面控制器、新竹即時氣象串接、「今天吃啥」測驗與浮島自動導覽
// 連接 island-data.js、island-world.js、island-landmarks.js 與 island-shops.js

import {
  NTHU_COORDS,
  VEG_QUOTES,
  SKY_LINKS,
  QUIZ_QUESTIONS,
  getTaipeiClock,
  evaluateOpenStatus,
  loadIslandDataset,
  scoreQuizRecommendations,
  verifyIslandDataIntegrity
} from './island-data.js';
import { createIslandWorld } from './island-world.js';
import { buildCentralNthuHubScene } from './island-landmarks.js';
import { buildShopIslandScene, buildSkyDecorScene } from './island-shops.js';

const CRITTER_STORAGE_KEY = 'nthu_bwy_veggie_island_critters_2026';
const TOTAL_CRITTERS = 12;

// 12 隻真正計入尋寶任務之浮島小夥伴：6 隻清華松鼠 + 6 隻清華胖達（排除攤位小人、攤位本體、肌肉奶蛙與紅綠燈）
const COMPANION_CRITTER_IDS = new Set([
  'critter-hub-squirrel',
  'critter-hub-panda',
  'critter-yasuzhai',
  'critter-miaoguanyin',
  'critter-amushi',
  'critter-zaozishu',
  'critter-dingsheng',
  'critter-mansuyuan',
  'critter-yixiansu',
  'critter-youmama',
  'critter-caigenxiang',
  'critter-suyiyuan'
]);
const TIME_MODES = [
  { key: 'auto', label: '自動' },
  { key: 'day', label: '晴晝' },
  { key: 'dusk', label: '夕照' },
  { key: 'night', label: '星夜' }
];

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function interpretWmoCode(code) {
  if (code === 0) return { label: '晴朗無雲', kind: 'clear' };
  if (code === 1 || code === 2) return { label: '晴時多雲', kind: 'clear' };
  if (code === 3) return { label: '多雲陰天', kind: 'cloudy' };
  if (code === 45 || code === 48) return { label: '薄霧微涼', kind: 'cloudy' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: '新竹陣雨', kind: 'rain' };
  if (code >= 95) return { label: '雷陣雨', kind: 'storm' };
  return { label: '舒適微風', kind: 'clear' };
}

/**
 * 右下角《品嚐幸福》YouTube MV 浮動音樂播放器與手持裝置迷你播放列初始化
 * 參考 encore.taipei/2026 嵌入模式，支援桌機完整畫面與手持裝置純迷你控制列（含自定義紅色進度條、音量膠囊與時間標籤）
 */
function initYouTubeMusicPlayer() {
  const elWidget = document.getElementById('ytMusicWidget');
  const elLauncher = document.getElementById('btnYtLauncher');
  const elBtnToggle = document.getElementById('btnYtToggleSize');
  const elBtnClose = document.getElementById('btnYtClose');
  const elBtnPlayPause = document.getElementById('btnYtPlayPause');
  const elIconPlayPause = document.getElementById('iconYtPlayPause');
  const elProgressContainer = document.getElementById('ytProgressContainer');
  const elProgressFill = document.getElementById('ytProgressFill');
  const elProgressDot = document.getElementById('ytProgressDot');
  const elBtnMute = document.getElementById('btnYtMute');
  const elIconVol = document.getElementById('iconYtVol');
  const elVolSlider = document.getElementById('ytVolSlider');
  const elVolTooltip = document.getElementById('ytVolTooltip');
  const elTimeDisplay = document.getElementById('ytTimeDisplay');

  if (!elWidget) return;

  const VIDEO_ID = '70FFY2jgGiw'; // 《品嚐幸福》官方 MV
  let player = null;
  let isPlaying = false;
  let isMuted = false;
  let updateInterval = null;

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateProgress() {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    try {
      const cur = player.getCurrentTime() || 0;
      const dur = player.getDuration() || 238; // 3分58秒
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));

      if (elProgressFill) elProgressFill.style.width = pct + '%';
      if (elProgressDot) elProgressDot.style.left = pct + '%';
      if (elTimeDisplay) elTimeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
    } catch {
      // 容錯防禦
    }
  }

  function startProgressLoop() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateProgress, 250);
  }

  function stopProgressLoop() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    updateProgress();
  }

  function setupPlayer() {
    player = new window.YT.Player('ytPlayerContainer', {
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        playsinline: 1,
        loop: 1,
        playlist: VIDEO_ID,
        enablejsapi: 1
      },
      events: {
        onReady(e) {
          try {
            player.setVolume(25);
            if (elVolSlider) elVolSlider.value = 25;
            player.playVideo();
          } catch {}
          updateProgress();
        },
        onStateChange(e) {
          if (e.data === window.YT.PlayerState.PLAYING) {
            isPlaying = true;
            if (elIconPlayPause) elIconPlayPause.textContent = '❚❚';
            startProgressLoop();
          } else {
            isPlaying = false;
            if (elIconPlayPause) elIconPlayPause.textContent = '▶';
            stopProgressLoop();
          }
        }
      }
    });
  }

  // 載入 YouTube IFrame API
  if (window.YT && window.YT.Player) {
    setupPlayer();
  } else {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === 'function') prevReady();
      setupPlayer();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  }

  // 瀏覽器 Autoplay 策略相容保護：若初次載入遭瀏覽器限制，於使用者首次點擊或觸控頁面時立即啟動
  const unlockAutoplay = () => {
    if (player && typeof player.getPlayerState === 'function') {
      const state = player.getPlayerState();
      if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
        try {
          player.playVideo();
        } catch {}
      }
    }
    window.removeEventListener('click', unlockAutoplay);
    window.removeEventListener('touchstart', unlockAutoplay);
  };
  window.addEventListener('click', unlockAutoplay, { once: true });
  window.addEventListener('touchstart', unlockAutoplay, { once: true });

  // 1. 播放/暫停按鈕
  elBtnPlayPause?.addEventListener('click', () => {
    if (!player || typeof player.playVideo !== 'function') return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  });

  // 2. 點擊進度條跳轉 (Seek)
  elProgressContainer?.addEventListener('click', e => {
    if (!player || typeof player.seekTo !== 'function') return;
    const rect = elProgressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const dur = (typeof player.getDuration === 'function' ? player.getDuration() : 238) || 238;
    player.seekTo(ratio * dur, true);
    updateProgress();
  });

  // 3. 音量滑桿
  elVolSlider?.addEventListener('input', e => {
    if (!player || typeof player.setVolume !== 'function') return;
    const val = Number(e.target.value);
    player.setVolume(val);
    if (val === 0) {
      player.mute();
      isMuted = true;
      if (elIconVol) elIconVol.textContent = '🔇';
      if (elVolTooltip) elVolTooltip.textContent = '開聲音 M';
    } else if (isMuted) {
      player.unMute();
      isMuted = false;
      if (elIconVol) elIconVol.textContent = '🔊';
      if (elVolTooltip) elVolTooltip.textContent = '靜音 M';
    }
  });

  // 4. 靜音按鈕
  elBtnMute?.addEventListener('click', () => {
    if (!player || typeof player.mute !== 'function') return;
    if (isMuted) {
      player.unMute();
      isMuted = false;
      if (elIconVol) elIconVol.textContent = '🔊';
      if (elVolTooltip) elVolTooltip.textContent = '靜音 M';
    } else {
      player.mute();
      isMuted = true;
      if (elIconVol) elIconVol.textContent = '🔇';
      if (elVolTooltip) elVolTooltip.textContent = '開聲音 M';
    }
  });

  // 鍵盤 M 鍵快速切換靜音
  window.addEventListener('keydown', e => {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'm' || e.key === 'M') {
      elBtnMute?.click();
    }
  });

  // 5. 切換精簡/畫面模式
  elBtnToggle?.addEventListener('click', () => {
    elWidget.classList.toggle('mini');
    const isMini = elWidget.classList.contains('mini');
    elBtnToggle.textContent = isMini ? '□' : '_';
    elBtnToggle.title = isMini ? '展開畫面' : '最小化收合';
  });

  // 6. 關閉與重新展開浮動播放器
  elBtnClose?.addEventListener('click', () => {
    elWidget.hidden = true;
    if (elLauncher) elLauncher.hidden = false;
  });

  elLauncher?.addEventListener('click', () => {
    elWidget.hidden = false;
    elLauncher.hidden = true;
  });
}

async function bootstrap() {
  const elStage = document.getElementById('stage');
  const elLabelLayer = document.getElementById('labelLayer');
  const elIntro = document.getElementById('introOverlay');
  const elIntroFill = document.getElementById('introProgressFill');
  const elIntroStep = document.getElementById('introStepText');
  const elToast = document.getElementById('toastMsg');

  const setIntroProgress = (pct, msg) => {
    if (elIntroFill) elIntroFill.style.width = `${pct}%`;
    if (elIntroStep) elIntroStep.textContent = msg;
  };

  let toastTimer = 0;
  function showToast(text, duration = 2600) {
    if (!elToast) return;
    elToast.textContent = text;
    elToast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      elToast.hidden = true;
    }, duration);
  }

  function dismissIntro() {
    if (!elIntro || elIntro.classList.contains('leave')) return;
    elIntro.classList.add('leave');
    window.setTimeout(() => {
      elIntro.hidden = true;
    }, 580);
  }
  document.getElementById('btnIntroSkip')?.addEventListener('click', dismissIntro);

  // 1. 驗證並載入 TOP 10 蔬食餐廳 TSV 資料
  setIntroProgress(35, '正在驗證 UTF-8 蔬食餐廳 TOP 10 資料與營業時間...');
  verifyIslandDataIntegrity();
  const dataset = await loadIslandDataset();

  // 2. 初始化 UI 狀態
  const uiState = {
    selectedId: null,
    hoveredId: null,
    activeTab: 0,
    sheetFull: false,
    viewMode: 'panorama',
    showLabels: true,
    showLinks: false,
    timeIdx: 0,
    animate: true,
    listFilter: 'all',
    quoteIdx: 0,
    radarCollapsed: false,
    openStatusMap: {},
    foundCritters: new Set(),
    tour: {
      active: false,
      paused: false,
      stepIdx: 0,
      elapsedMs: 0,
      durationMs: 6500
    },
    quiz: {
      open: false,
      step: 0,
      answers: []
    }
  };

  try {
    const saved = JSON.parse(localStorage.getItem(CRITTER_STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) {
      saved
        .map(id => (id === 'critter-hub-broccoli' ? 'critter-hub-panda' : id))
        .filter(id => COMPANION_CRITTER_IDS.has(id))
        .forEach(id => uiState.foundCritters.add(id));
    }
  } catch {
    // shortcut: 瀏覽器無痕模式阻擋 localStorage 時僅維持記憶體內計數
  }

  // 3. 建立 2D 螢幕投影 DOM 錨點（11 座浮島名牌 + 10 條覓食航線膠囊 + 1 個松鼠對話氣泡）
  const nameplateAnchors = new Map();
  for (const island of dataset.allIslands) {
    const anchor = document.createElement('div');
    anchor.className = 'proj-anchor';
    anchor.hidden = true;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nameplate';
    btn.style.setProperty('--c', island.color);
    btn.dataset.islandId = island.id;

    if (island.isHub) {
      btn.innerHTML = `<span class="np-badge">主島</span><span>清華大學</span>`;
    } else {
      btn.innerHTML = `
        <span class="np-badge">${island.badgeNo}</span>
        <span>${esc(island.short)}</span>
        <span class="np-price">${esc(island.price)}</span>
        <i class="np-status" data-status-dot="${esc(island.id)}" title="即時營業狀態"></i>
      `;
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      selectIsland(island.id, { fly: true });
    });
    btn.addEventListener('mouseenter', () => setHoveredIsland(island.id));
    btn.addEventListener('mouseleave', () => setHoveredIsland(null));

    anchor.appendChild(btn);
    elLabelLayer.appendChild(anchor);
    nameplateAnchors.set(island.id, { anchor, btn });
  }

  const linkLabelEls = SKY_LINKS.map(link => {
    const anchor = document.createElement('div');
    anchor.className = 'proj-anchor';
    anchor.hidden = true;
    const span = document.createElement('span');
    span.className = 'linklabel';
    span.textContent = link.label;
    anchor.appendChild(span);
    elLabelLayer.appendChild(anchor);
    return anchor;
  });

  const bubbleAnchor = document.createElement('div');
  bubbleAnchor.className = 'proj-anchor';
  bubbleAnchor.hidden = true;
  const bubbleBox = document.createElement('div');
  bubbleBox.className = 'bubble';
  bubbleAnchor.appendChild(bubbleBox);
  elLabelLayer.appendChild(bubbleAnchor);

  // 4. 啟動 3D 天空之城浮島引擎（自動執行靜態幾何合併與移軸微縮後製）
  setIntroProgress(72, '正在拼裝清華簡冊立柱與合併 11 座浮島靜態積木...');
  const world = createIslandWorld({
    container: elStage,
    dataset,
    skyLinks: SKY_LINKS,
    buildHubScene: (group, ctx) => {
      buildCentralNthuHubScene(group, {
        ...ctx,
        registerCritter: (hitObj, meta) => {
          if (uiState.foundCritters.has(meta.id)) meta.markFound?.();
          ctx.registerCritter(hitObj, meta);
        }
      });
    },
    buildShopScene: (group, ctx) => {
      buildShopIslandScene(group, {
        ...ctx,
        registerCritter: (hitObj, meta) => {
          if (uiState.foundCritters.has(meta.id)) meta.markFound?.();
          ctx.registerCritter(hitObj, meta);
        }
      });
    },
    buildSkyDecor: (group, ctx) => {
      buildSkyDecorScene(group, {
        ...ctx,
        registerCritter: (hitObj, meta) => {
          if (uiState.foundCritters.has(meta.id)) meta.markFound?.();
          ctx.registerCritter(hitObj, meta);
        }
      });
    },
    onSelectIsland(islandId) {
      selectIsland(islandId, { fly: false });
    },
    onHoverIsland(islandId) {
      setHoveredIsland(islandId);
    },
    onClickCritter(meta) {
      if (!meta?.id) return;
      // 僅 12 隻小夥伴計入尋寶小遊戲進度（排除攤位小人、攤位、奶蛙、紅綠燈等彩蛋）
      if (!COMPANION_CRITTER_IDS.has(meta.id)) {
        return;
      }
      const isNew = !uiState.foundCritters.has(meta.id);
      if (isNew) {
        uiState.foundCritters.add(meta.id);
        try {
          localStorage.setItem(CRITTER_STORAGE_KEY, JSON.stringify([...uiState.foundCritters]));
        } catch {
          // ignore storage quota errors
        }
        updateCritterCounter();
        if (uiState.foundCritters.size >= TOTAL_CRITTERS) {
          showToast('恭喜集滿全島 12 隻清華松鼠與清華胖達！', 3600);
        } else {
          showToast(`尋獲浮島小夥伴！（目前已找到 ${uiState.foundCritters.size} / ${TOTAL_CRITTERS}）`, 2200);
        }
      }
    },
    onFrameLabels({ islandCoords, linkCoords, bubble }) {
      // 同步 11 座浮島 2D 名牌螢幕座標（使用 translate3d 零重排）
      nameplateAnchors.forEach(({ anchor }, id) => {
        const pt = uiState.showLabels ? islandCoords[id] : null;
        if (!pt) {
          if (!anchor.hidden) anchor.hidden = true;
          return;
        }
        if (anchor.hidden) anchor.hidden = false;
        anchor.style.transform = `translate3d(${Math.round(pt.x)}px, ${Math.round(pt.y)}px, 0) translate(-50%, -100%)`;
      });

      // 同步覓食航線標籤
      linkLabelEls.forEach((anchor, idx) => {
        const item = uiState.showLinks ? linkCoords[idx] : null;
        if (!item?.screen) {
          if (!anchor.hidden) anchor.hidden = true;
          return;
        }
        if (anchor.hidden) anchor.hidden = false;
        anchor.style.transform = `translate3d(${item.screen.x.toFixed(1)}px, ${item.screen.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      });

      // 同步松鼠對話氣泡
      if (bubble?.screen) {
        bubbleBox.textContent = bubble.text;
        bubbleAnchor.hidden = false;
        bubbleAnchor.style.transform = `translate3d(${bubble.screen.x.toFixed(1)}px, ${bubble.screen.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      } else if (!bubbleAnchor.hidden) {
        bubbleAnchor.hidden = true;
      }
    }
  });

  // 同步移軸特效按鈕初始狀態（桌機預設 ON，手機自動 OFF 省電）
  syncToggleButtons();

  // ==========================================================================
  // 5. 即時營業狀態計算（台灣時區 Asia/Taipei）與雷達清單更新
  // ==========================================================================
  function refreshLiveBusinessStatus() {
    const now = new Date();
    const tw = getTaipeiClock(now);
    const elTwDate = document.getElementById('twDateStr');
    if (elTwDate) {
      elTwDate.textContent = `${tw.month} 月 ${tw.date} 日（週${tw.weekChar}）${tw.timeStr}`;
    }

    let openCount = 0;
    for (const shop of dataset.shops) {
      const st = evaluateOpenStatus(shop.hoursRaw, now);
      uiState.openStatusMap[shop.id] = st;
      if (st.isOpen) openCount++;

      const dot = document.querySelector(`[data-status-dot="${shop.id}"]`);
      if (dot) {
        dot.className = `np-status ${st.state}`;
        dot.title = st.label;
      }
    }

    const elOpenCount = document.getElementById('openCountPill');
    if (elOpenCount) {
      elOpenCount.textContent = openCount > 0 ? `目前營業中 ${openCount} / 10 家` : '目前非營業時段（可預覽菜單）';
    }

    renderRadarList();
    if (!document.getElementById('listView').hidden) renderListView();
  }

  function renderRadarList() {
    const elList = document.getElementById('radarList');
    if (!elList) return;
    // 營業中優先置頂，其次維持內環 #1~#5 與外環 #1~#5 順序
    const sorted = [...dataset.shops].sort((a, b) => {
      const oa = uiState.openStatusMap[a.id]?.isOpen ? 1 : 0;
      const ob = uiState.openStatusMap[b.id]?.isOpen ? 1 : 0;
      if (oa !== ob) return ob - oa;
      if (a.ring !== b.ring) return a.ring === 'inner' ? -1 : 1;
      return a.badgeNo - b.badgeNo;
    });

    elList.innerHTML = sorted
      .map(shop => {
        const st = uiState.openStatusMap[shop.id] || { state: 'closed', label: '休息中' };
        const shortState = st.isOpen ? '營業中' : st.state === 'holiday' ? '公休' : '休息中';
        const isAct = uiState.selectedId === shop.id ? 'active' : '';
        return `
          <li>
            <button type="button" class="radar-item ${isAct}" data-radar-shop="${esc(shop.id)}">
              <span class="radar-num" style="background:${esc(shop.color)}">${shop.badgeNo}</span>
              <span class="radar-info">
                <b>${esc(shop.short)}</b>
                <span>${esc(shop.price)}・${esc(shop.travelHint)}</span>
              </span>
              <span class="radar-badge ${st.state}">${shortState}</span>
            </button>
          </li>
        `;
      })
      .join('');

    elList.querySelectorAll('[data-radar-shop]').forEach(btn => {
      btn.addEventListener('click', () => selectIsland(btn.dataset.radarShop, { fly: true }));
    });
  }

  function updateCritterCounter() {
    const el = document.getElementById('critterCountText');
    if (!el) return;
    const count = Math.min(uiState.foundCritters.size, TOTAL_CRITTERS);
    if (count >= TOTAL_CRITTERS) {
      el.innerHTML = `<strong>好眼力，已尋獲全部小夥伴</strong>`;
    } else {
      el.innerHTML = `已尋獲 <strong>${count} / ${TOTAL_CRITTERS}</strong> 隻浮島小夥伴`;
    }
  }
  updateCritterCounter();

  // ==========================================================================
  // 6. 選取浮島與右側滑入詳情面板 / 手機 Bottom Sheet 渲染
  // ==========================================================================
  const elPanel = document.getElementById('detailPanel');
  const elPanelHead = document.getElementById('panelHead');
  const elPanelKind = document.getElementById('panelKind');
  const elPanelTitle = document.getElementById('panelTitle');
  const elPanelStatus = document.getElementById('panelStatusPill');
  const elPanelSub = document.getElementById('panelSub');
  const elPanelTabs = document.getElementById('panelTabs');
  const elPanelBody = document.getElementById('panelBody');
  const elSheetHint = document.getElementById('sheetHandleHint');

  function setHoveredIsland(id) {
    uiState.hoveredId = id;
    nameplateAnchors.forEach(({ btn }, key) => {
      btn.classList.toggle('hovered', key === id);
    });
  }

  function syncSheetClasses() {
    elPanel.classList.toggle('sheet-full', uiState.sheetFull);
    elPanel.classList.toggle('sheet-peek', !uiState.sheetFull);
    if (elSheetHint) {
      elSheetHint.textContent = uiState.sheetFull ? '點此收合為預覽高度' : '點此展開完整餐廳資訊';
    }
  }

  function selectIsland(islandId, { fly = true } = {}) {
    if (!islandId || !dataset.byId[islandId]) {
      closeDetailPanel({ flyOverview: fly });
      return;
    }

    if (uiState.tour.active) stopTour({ keepSelection: true });

    uiState.selectedId = islandId;
    uiState.activeTab = 0;
    uiState.sheetFull = false;
    syncSheetClasses();

    document.body.classList.add('has-panel');
    elPanel.hidden = false;

    nameplateAnchors.forEach(({ btn }, key) => {
      btn.classList.toggle('selected', key === islandId);
    });

    if (fly) world.flyToIsland(islandId);
    renderDetailPanel();
    renderRadarList();
  }

  function closeDetailPanel({ flyOverview = true } = {}) {
    uiState.selectedId = null;
    document.body.classList.remove('has-panel');
    elPanel.hidden = true;
    nameplateAnchors.forEach(({ btn }) => btn.classList.remove('selected'));
    if (flyOverview) {
      world.flyToIsland(null);
    }
    renderRadarList();
  }

  function renderDetailPanel() {
    const island = dataset.byId[uiState.selectedId];
    if (!island) return;

    elPanel.style.setProperty('--c', island.color);
    elPanelHead.style.setProperty('--c', island.color);

    if (island.isHub) {
      elPanelKind.textContent = island.tagLabel;
      elPanelTitle.textContent = island.name;
      elPanelStatus.className = 'status-pill open';
      elPanelStatus.textContent = '天空之城核心';
      elPanelSub.textContent = island.tagline;

      const hubTabs = ['主島與校門介紹', 'TOP 10 快速跳島'];
      elPanelTabs.innerHTML = hubTabs
        .map((t, idx) => `<button type="button" role="tab" class="${uiState.activeTab === idx ? 'on' : ''}" data-tab="${idx}">${t}</button>`)
        .join('');

      if (uiState.activeTab === 0) {
        elPanelBody.innerHTML = `
          <h4>浮島微縮地標亮點</h4>
          <div class="scene-box">${esc(island.sceneDesc)}</div>
          <h4>2026 清大福青蔬食地圖特色</h4>
          <ul class="feature-list">
            ${island.highlights.map(h => `<li>${esc(h)}</li>`).join('')}
          </ul>
          <div class="action-row">
            ${island.links
              .map(l => `<a class="action-btn ${l.primary ? 'primary' : ''}" href="${esc(l.href)}">${esc(l.label)}</a>`)
              .join('')}
          </div>
        `;
      } else {
        elPanelBody.innerHTML = `
          <h4>點擊任一餐廳直接飛往該座浮島</h4>
          <div class="price-bars">
            ${dataset.shops
              .map(s => {
                const st = uiState.openStatusMap[s.id];
                const tag = s.ring === 'inner' ? `推薦 #${s.badgeNo}` : `單車 #${s.badgeNo}`;
                return `
                  <button type="button" class="pbar-row" data-jump-shop="${esc(s.id)}">
                    <span class="pbar-name">${esc(s.short)}</span>
                    <span style="color:var(--ink-2);font-size:12px">${tag}・${esc(s.diet)}</span>
                    <span class="pbar-val" style="color:${st?.isOpen ? 'var(--open)' : 'var(--muted)'}">${st?.isOpen ? '營業中' : esc(s.price)}</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        `;
      }
    } else {
      const st = uiState.openStatusMap[island.id] || evaluateOpenStatus(island.hoursRaw);
      elPanelKind.textContent = island.tagLabel;
      elPanelTitle.textContent = island.name;
      elPanelStatus.className = `status-pill ${st.state}`;
      elPanelStatus.textContent = st.label;
      elPanelSub.textContent = `${island.categoryClean}｜${island.travelHint}`;

      const shopTabs = ['店家總覽', '營業與比價'];
      elPanelTabs.innerHTML = shopTabs
        .map((t, idx) => `<button type="button" role="tab" class="${uiState.activeTab === idx ? 'on' : ''}" data-tab="${idx}">${t}</button>`)
        .join('');

      if (uiState.activeTab === 0) {
        elPanelBody.innerHTML = `
          <div class="kpi-grid">
            <div class="kpi-tile">
              <span class="kpi-label">參考價位</span>
              <span class="kpi-val">${esc(island.price)}</span>
            </div>
            <div class="kpi-tile">
              <span class="kpi-label">素食種類</span>
              <span class="kpi-val">${esc(island.diet)}</span>
            </div>
            <div class="kpi-tile">
              <span class="kpi-label">清大出發</span>
              <span class="kpi-val" style="font-size:13.5px">${esc(island.groupBadge)}</span>
            </div>
          </div>

          <h4>必點推薦餐點</h4>
          <div class="chips">
            ${island.dishes.map(d => `<span class="chip accent">${esc(d)}</span>`).join('')}
            ${(island.vegMapTags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}
          </div>

          <h4>浮島微縮模型導賞</h4>
          <div class="scene-box">${esc(island.sceneDesc)}</div>

          <h4>營業時段與地址</h4>
          <ul class="info-list">
            <li><strong>營業時間（台灣時區即時比對）</strong>${esc(island.hoursDisplay)}</li>
            <li><strong>餐廳地址</strong>${esc(island.address)}${island.note ? `（${esc(island.note)}）` : ''}</li>
          </ul>

          <div class="action-row">
            <a class="action-btn primary" href="${esc(island.mapsUrl)}" target="_blank" rel="noopener">Google 地圖導航</a>
            ${island.telHref ? `<a class="action-btn" href="${esc(island.telHref)}">電話：${esc(island.phone.split(/[；;]/)[0])}</a>` : ''}
          </div>
        `;
      } else {
        const maxBudget = 200;
        elPanelBody.innerHTML = `
          <ul class="info-list">
            <li><strong>完整聯絡電話</strong>${esc(island.phone || '現場洽詢')}</li>
            <li><strong>餐點類型與素別</strong>${esc(island.categoryClean)}</li>
            <li><strong>入選 2026 清大福青蔬食月分類</strong>${esc(island.tagLabel)}${island.note ? `・${esc(island.note)}` : ''}</li>
          </ul>

          <h4>TOP 10 餐廳預算區間橫向對照（點擊可跳島）</h4>
          <div class="price-bars">
            ${dataset.shops
              .map(s => {
                const avg = Math.round((s.priceMin + s.priceMax) / 2);
                const pct = Math.min(100, Math.round((s.priceMax / maxBudget) * 100));
                const cur = s.id === island.id ? 'current' : '';
                return `
                  <button type="button" class="pbar-row ${cur}" data-jump-shop="${esc(s.id)}" title="平均約 $${avg}，點擊飛往 ${esc(s.name)}">
                    <span class="pbar-name">${esc(s.short)}</span>
                    <span class="pbar-track"><i class="pbar-fill" style="width:${pct}%;background:${esc(s.color)}"></i></span>
                    <span class="pbar-val">${esc(s.price)}</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        `;
      }
    }

    elPanelTabs.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        uiState.activeTab = Number(btn.dataset.tab);
        uiState.sheetFull = true;
        syncSheetClasses();
        renderDetailPanel();
      });
    });

    elPanelBody.querySelectorAll('[data-jump-shop]').forEach(btn => {
      btn.addEventListener('click', () => selectIsland(btn.dataset.jumpShop, { fly: true }));
    });
  }

  document.getElementById('btnSheetHandle')?.addEventListener('click', () => {
    uiState.sheetFull = !uiState.sheetFull;
    syncSheetClasses();
  });

  document.getElementById('btnClosePanel')?.addEventListener('click', () => closeDetailPanel({ flyOverview: true }));

  function stepSelectedIsland(delta) {
    const list = dataset.allIslands;
    const curIdx = Math.max(0, list.findIndex(x => x.id === uiState.selectedId));
    const next = list[(curIdx + delta + list.length) % list.length];
    selectIsland(next.id, { fly: true });
  }
  document.getElementById('btnPrevIsland')?.addEventListener('click', () => stepSelectedIsland(-1));
  document.getElementById('btnNextIsland')?.addEventListener('click', () => stepSelectedIsland(1));

  // ==========================================================================
  // 7. 頂部語錄輪播、新竹清大 Open-Meteo 即時天氣與左側雷達收合
  // ==========================================================================
  function renderQuote() {
    const [text, tag] = VEG_QUOTES[uiState.quoteIdx % VEG_QUOTES.length];
    const elTag = document.getElementById('quoteTag');
    const elText = document.getElementById('quoteText');
    if (elTag) elTag.textContent = tag;
    if (elText) elText.textContent = text;
  }
  document.getElementById('btnNextQuote')?.addEventListener('click', () => {
    uiState.quoteIdx = (uiState.quoteIdx + 1) % VEG_QUOTES.length;
    renderQuote();
  });
  window.setInterval(() => {
    uiState.quoteIdx = (uiState.quoteIdx + 1) % VEG_QUOTES.length;
    renderQuote();
  }, 9500);

  document.getElementById('btnToggleRadar')?.addEventListener('click', e => {
    uiState.radarCollapsed = !uiState.radarCollapsed;
    const content = document.getElementById('radarContent');
    if (content) content.hidden = uiState.radarCollapsed;
    e.currentTarget.textContent = uiState.radarCollapsed ? '+' : '−';
  });

  async function fetchHsinchuWeather() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${NTHU_COORDS.lat}&longitude=${NTHU_COORDS.lng}&current=temperature_2m,apparent_temperature,weather_code&daily=precipitation_probability_max&timezone=Asia%2FTaipei&forecast_days=1`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('weather status');
      const data = await resp.json();
      const temp = Math.round(data.current?.temperature_2m ?? 24);
      const feels = Math.round(data.current?.apparent_temperature ?? temp);
      const code = Number(data.current?.weather_code ?? 1);
      const rainProb = data.daily?.precipitation_probability_max?.[0] ?? 10;
      const wx = interpretWmoCode(code);

      const elSum = document.getElementById('wxSummary');
      const elSub = document.getElementById('wxSub');
      if (elSum) elSum.textContent = `清華大學 ${temp}°C・${wx.label}`;
      if (elSub) elSub.textContent = `體感 ${feels}°C・降雨機率 ${rainProb}%`;

      world.setWeatherKind(wx.kind);
    } catch {
      const elSum = document.getElementById('wxSummary');
      const elSub = document.getElementById('wxSub');
      if (elSum) elSum.textContent = `${NTHU_COORDS.placeName}`;
      if (elSub) elSub.textContent = '晴時多雲・適合散步吃蔬食';
    }
  }

  // ==========================================================================
  // 8. 底部工具列：視角切換、清單篩選、日夜四段光影與移軸微縮開關
  // ==========================================================================
  const elListView = document.getElementById('listView');

  function setViewMode(mode) {
    uiState.viewMode = mode;
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.view === mode);
    });
    if (mode === 'list') {
      renderListView();
      elListView.hidden = false;
    } else {
      elListView.hidden = true;
      closeDetailPanel({ flyOverview: false });
      world.setViewMode(mode);
    }
  }

  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.view));
  });
  document.getElementById('btnCloseListView')?.addEventListener('click', () => setViewMode('panorama'));

  function renderListView() {
    const grid = document.getElementById('listCardsGrid');
    if (!grid) return;

    const filtered = dataset.shops.filter(s => {
      if (uiState.listFilter === 'inner') return s.ring === 'inner';
      if (uiState.listFilter === 'outer') return s.ring === 'outer';
      if (uiState.listFilter === 'vegan') return s.isPureVegan;
      if (uiState.listFilter === 'open') return uiState.openStatusMap[s.id]?.isOpen;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="shop-card" style="--c:var(--teal)"><b>目前無符合此篩選條件的店家</b><span class="shop-card-dishes">可切換為「全部 (10)」查看完整推薦名單與營業時段。</span></div>`;
      return;
    }

    grid.innerHTML = filtered
      .map(s => {
        const st = uiState.openStatusMap[s.id] || evaluateOpenStatus(s.hoursRaw);
        return `
          <button type="button" class="shop-card" style="--c:${esc(s.color)}" data-card-shop="${esc(s.id)}">
            <div class="shop-card-top">
              <span>${esc(s.tagLabel)}</span>
              <span class="status-pill ${st.state}">${esc(st.isOpen ? '營業中' : st.label)}</span>
            </div>
            <b>${esc(s.name)}</b>
            <div class="shop-card-dishes">推薦：${esc(s.dishes.join('、'))}</div>
            <div class="shop-card-meta">
              <span>${esc(s.price)}｜${esc(s.diet)}</span>
              <span>飛往浮島 →</span>
            </div>
          </button>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-card-shop]').forEach(btn => {
      btn.addEventListener('click', () => {
        elListView.hidden = true;
        uiState.viewMode = 'panorama';
        document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === 'panorama'));
        selectIsland(btn.dataset.cardShop, { fly: true });
      });
    });
  }

  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      uiState.listFilter = btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('on', b.dataset.filter === uiState.listFilter));
      renderListView();
    });
  });

  function syncToggleButtons() {
    const fxOn = world.getFx();
    const curTime = TIME_MODES[uiState.timeIdx];
    const elTopTimeBtn = document.getElementById('btnTopTimeToggle');

    if (elTopTimeBtn) {
      const isNightLike = curTime.key === 'night' || (curTime.key === 'auto' && (new Date().getHours() < 6 || new Date().getHours() >= 18));
      elTopTimeBtn.textContent = isNightLike ? '☀️ 白天' : '🌙 黑夜';
      elTopTimeBtn.title = isNightLike
        ? '目前為夜間光影，點擊強制切換為清晰白天（方便尋找松鼠與清華胖達）'
        : '目前為白天光影，點擊切換為浪漫星夜';
    }

    document.querySelectorAll('[data-toggle]').forEach(btn => {
      const kind = btn.dataset.toggle;
      const inMobileMenu = Boolean(btn.closest('#mobileMoreMenu'));
      if (kind === 'labels') btn.classList.toggle('on', uiState.showLabels);
      else if (kind === 'links') btn.classList.toggle('on', uiState.showLinks);
      else if (kind === 'fx') btn.classList.toggle('on', fxOn);
      else if (kind === 'anim') btn.classList.toggle('on', uiState.animate);
      else if (kind === 'time') {
        btn.classList.toggle('on', curTime.key !== 'auto');
        btn.textContent = inMobileMenu ? `日夜:${curTime.label}` : `日夜：${curTime.label}`;
      }
    });
  }

  const elTopTimeBtn = document.getElementById('btnTopTimeToggle');
  if (elTopTimeBtn) {
    elTopTimeBtn.addEventListener('click', () => {
      const curTime = TIME_MODES[uiState.timeIdx];
      // 如果目前是白天（或非夜晚），切換到夜晚；否則一鍵切換至白天
      const targetKey = curTime.key === 'day' ? 'night' : 'day';
      const targetIdx = TIME_MODES.findIndex(m => m.key === targetKey);
      if (targetIdx >= 0) {
        uiState.timeIdx = targetIdx;
        world.setTimeMode(targetKey);
        showToast(targetKey === 'day' ? '已切換為清晰晴晝（全島松鼠與清華胖達清晰可見！）' : '已切換為浪漫星夜光影');
        syncToggleButtons();
      }
    });
  }

  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.toggle;
      if (kind === 'labels') {
        uiState.showLabels = !uiState.showLabels;
      } else if (kind === 'links') {
        uiState.showLinks = !uiState.showLinks;
        world.setShowLinks(uiState.showLinks);
        showToast(uiState.showLinks ? '已開啟天空覓食航線與步行單車圈標示' : '已隱藏天空覓食航線');
      } else if (kind === 'time') {
        uiState.timeIdx = (uiState.timeIdx + 1) % TIME_MODES.length;
        const mode = TIME_MODES[uiState.timeIdx];
        world.setTimeMode(mode.key);
        showToast(`光影切換為：${mode.label}`);
      } else if (kind === 'fx') {
        const next = world.setFx(!world.getFx());
        showToast(next ? '已開啟移軸微縮景深後製 (Tilt-Shift)' : '已關閉移軸後製（省電高幀率模式）');
      } else if (kind === 'anim') {
        uiState.animate = !uiState.animate;
        world.setAnimate(uiState.animate);
      }
      syncToggleButtons();
    });
  });

  const elMoreMenu = document.getElementById('mobileMoreMenu');
  document.getElementById('btnMobileMore')?.addEventListener('click', e => {
    e.stopPropagation();
    elMoreMenu.hidden = !elMoreMenu.hidden;
  });
  document.addEventListener('click', e => {
    if (elMoreMenu && !elMoreMenu.hidden && !e.target.closest('.more-wrap')) {
      elMoreMenu.hidden = true;
    }
  });

  // ==========================================================================
  // 9. 浮島自動巡航導覽 (Guided Sky-Island Tour)
  // ==========================================================================
  const elTourCard = document.getElementById('tourCard');
  const elTourBtn = document.getElementById('btnToggleTour');
  const elTourDots = document.getElementById('tourDots');

  function renderTourCard() {
    const list = dataset.allIslands;
    const item = list[uiState.tour.stepIdx];
    if (!item) return;

    elTourCard.style.setProperty('--c', item.color);
    document.getElementById('tourStepLabel').textContent = `${uiState.tour.stepIdx + 1} / ${list.length}`;
    document.getElementById('tourBadge').textContent = item.isHub ? '清華主島' : item.ring === 'inner' ? `推薦 #${item.badgeNo}` : `單車 #${item.badgeNo}`;
    document.getElementById('tourStateHint').textContent = uiState.tour.paused ? '已暫停' : '自動巡航中';
    document.getElementById('tourTitle').textContent = item.name;
    document.getElementById('tourDesc').textContent = item.isHub
      ? item.sceneDesc
      : `${item.price}｜推薦：${item.dishes.join('、')}。${item.sceneDesc}`;
    document.getElementById('btnTourPause').textContent = uiState.tour.paused ? '▶' : '❚❚';

    elTourDots.innerHTML = list
      .map((isl, idx) => `<button type="button" class="${idx === uiState.tour.stepIdx ? 'on' : ''}" data-tour-dot="${idx}" aria-label="${esc(isl.short)}"></button>`)
      .join('');
    elTourDots.querySelectorAll('[data-tour-dot]').forEach(b => {
      b.addEventListener('click', () => goToTourStep(Number(b.dataset.tourDot)));
    });
  }

  function goToTourStep(idx) {
    const list = dataset.allIslands;
    uiState.tour.stepIdx = (idx + list.length) % list.length;
    uiState.tour.elapsedMs = 0;
    const target = list[uiState.tour.stepIdx];
    nameplateAnchors.forEach(({ btn }, key) => btn.classList.toggle('selected', key === target.id));
    world.flyToIsland(target.id, { noPanelOffset: true, tourStep: uiState.tour.stepIdx });
    renderTourCard();
  }

  function startTour() {
    closeDetailPanel({ flyOverview: false });
    elListView.hidden = true;
    uiState.tour.active = true;
    uiState.tour.paused = false;
    uiState.tour.stepIdx = 0;
    uiState.tour.elapsedMs = 0;
    elTourCard.hidden = false;
    elTourBtn.classList.add('on');
    elTourBtn.textContent = '結束導覽';
    world.setTourActive(true);
    goToTourStep(0);
  }

  function stopTour({ keepSelection = false } = {}) {
    uiState.tour.active = false;
    elTourCard.hidden = true;
    elTourBtn.classList.remove('on');
    elTourBtn.textContent = '浮島導覽';
    world.setTourActive(false);
    if (!keepSelection) {
      nameplateAnchors.forEach(({ btn }) => btn.classList.remove('selected'));
      world.flyToIsland(null);
    }
  }

  elTourBtn?.addEventListener('click', () => {
    if (uiState.tour.active) stopTour();
    else startTour();
  });
  document.getElementById('btnTourPrev')?.addEventListener('click', () => goToTourStep(uiState.tour.stepIdx - 1));
  document.getElementById('btnTourNext')?.addEventListener('click', () => goToTourStep(uiState.tour.stepIdx + 1));
  document.getElementById('btnTourPause')?.addEventListener('click', () => {
    uiState.tour.paused = !uiState.tour.paused;
    renderTourCard();
  });
  document.getElementById('btnTourStop')?.addEventListener('click', () => stopTour());
  document.getElementById('btnTourOpenDetail')?.addEventListener('click', () => {
    const cur = dataset.allIslands[uiState.tour.stepIdx];
    stopTour({ keepSelection: true });
    if (cur) selectIsland(cur.id, { fly: true });
  });

  window.setInterval(() => {
    if (!uiState.tour.active || uiState.tour.paused) return;
    uiState.tour.elapsedMs += 100;
    const pct = Math.min(100, (uiState.tour.elapsedMs / uiState.tour.durationMs) * 100);
    const fill = document.getElementById('tourProgressFill');
    if (fill) fill.style.width = `${pct}%`;
    if (uiState.tour.elapsedMs >= uiState.tour.durationMs) {
      goToTourStep(uiState.tour.stepIdx + 1);
    }
  }, 100);

  // ==========================================================================
  // 10. 「今天吃什麼？」4 題尋味適性測驗 Modal
  // ==========================================================================
  const elQuizModal = document.getElementById('quizModal');
  const elQuizSteps = document.getElementById('quizSteps');
  const elQuizBody = document.getElementById('quizBody');

  function openQuiz() {
    uiState.quiz.open = true;
    uiState.quiz.step = 0;
    uiState.quiz.answers = [];
    elQuizModal.hidden = false;
    renderQuizStep();
  }

  function closeQuiz() {
    uiState.quiz.open = false;
    elQuizModal.hidden = true;
  }

  function renderQuizStep() {
    const total = QUIZ_QUESTIONS.length;
    const step = uiState.quiz.step;
    elQuizSteps.innerHTML = QUIZ_QUESTIONS.map((_, idx) => {
      const cls = idx < step ? 'done' : idx === step ? 'now' : '';
      return `<i class="${cls}"></i>`;
    }).join('');

    if (step < total) {
      const q = QUIZ_QUESTIONS[step];
      elQuizBody.innerHTML = `
        <h3>Q${step + 1}. ${esc(q.q)}</h3>
        <div class="quiz-opts">
          ${q.opts.map((opt, idx) => `<button type="button" class="quiz-opt-btn" data-qopt="${idx}">${esc(opt.label)}</button>`).join('')}
        </div>
        ${step > 0 ? `<button type="button" class="quiz-back" id="btnQuizBack">← 返回上一題</button>` : ''}
      `;
      elQuizBody.querySelectorAll('[data-qopt]').forEach(btn => {
        btn.addEventListener('click', () => {
          uiState.quiz.answers[step] = Number(btn.dataset.qopt);
          uiState.quiz.step++;
          renderQuizStep();
        });
      });
      document.getElementById('btnQuizBack')?.addEventListener('click', () => {
        uiState.quiz.step = Math.max(0, uiState.quiz.step - 1);
        renderQuizStep();
      });
    } else {
      const top3 = scoreQuizRecommendations(uiState.quiz.answers, dataset.shops).slice(0, 3);
      elQuizBody.innerHTML = `
        <h3>最適合你此刻胃口的天空蔬食浮島 TOP 3</h3>
        <ul class="quiz-results">
          ${top3
            .map(({ shop, matchPct }, idx) => {
              const st = uiState.openStatusMap[shop.id];
              return `
                <li class="quiz-res-item" style="--c:${esc(shop.color)}">
                  <div class="quiz-res-top">
                    <span class="quiz-rank">${idx + 1}</span>
                    <div>
                      <b>${esc(shop.name)}</b>
                      <div style="font-size:12.5px;color:var(--ink-2)">${esc(shop.price)}・${esc(shop.diet)}・${st?.isOpen ? '目前營業中' : esc(shop.travelHint)}</div>
                    </div>
                    <span class="quiz-pct">${matchPct}%</span>
                  </div>
                  <div class="quiz-bar"><i style="width:${matchPct}%"></i></div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--ink-2)">
                    <span>招牌：${esc(shop.dishes.slice(0, 2).join('、'))}</span>
                    <button type="button" class="quiz-fly-btn" data-quiz-fly="${esc(shop.id)}">立即飛往浮島 →</button>
                  </div>
                </li>
              `;
            })
            .join('')}
        </ul>
        <button type="button" class="quiz-back" id="btnQuizRestart">↻ 重新測驗</button>
      `;

      elQuizBody.querySelectorAll('[data-quiz-fly]').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.dataset.quizFly;
          closeQuiz();
          elListView.hidden = true;
          selectIsland(targetId, { fly: true });
        });
      });
      document.getElementById('btnQuizRestart')?.addEventListener('click', openQuiz);
    }
  }

  document.getElementById('btnOpenQuiz')?.addEventListener('click', openQuiz);
  document.getElementById('btnCloseQuiz')?.addEventListener('click', closeQuiz);
  elQuizModal?.addEventListener('click', e => {
    if (e.target === elQuizModal) closeQuiz();
  });

  // Escape 鍵快速關閉彈窗或返回全景
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!elQuizModal.hidden) closeQuiz();
    else if (!elListView.hidden) setViewMode('panorama');
    else if (uiState.tour.active) stopTour();
    else if (uiState.selectedId) closeDetailPanel({ flyOverview: true });
  });

  // 啟動即時營業判定（每 30 秒自動更新）與新竹即時氣象
  refreshLiveBusinessStatus();
  window.setInterval(refreshLiveBusinessStatus, 30000);
  fetchHsinchuWeather();

  // 支援網址參數深層連結（例如 ?shop=yasuzhai 或 ?time=night）
  const params = new URLSearchParams(window.location.search);
  const initTime = params.get('time');
  if (initTime) {
    const idx = TIME_MODES.findIndex(m => m.key === initTime);
    if (idx >= 0) {
      uiState.timeIdx = idx;
      world.setTimeMode(initTime);
      syncToggleButtons();
    }
  }
  const initShop = params.get('shop');
  if (initShop && dataset.byId[initShop]) {
    window.setTimeout(() => selectIsland(initShop, { fly: true }), 950);
  }

  // 初始化右下角《品嚐幸福》YouTube MV 浮動音樂播放器與手持裝置迷你播放列
  initYouTubeMusicPlayer();

  // 完成載入並優雅退場
  setIntroProgress(100, '天空之城浮島準備就緒，歡迎探索！');
  window.setTimeout(dismissIntro, 750);

  // 暴露自動化診斷與驗證控制代碼（不含任何機敏資料）
  window.__ISLAND_APP__ = {
    dataset,
    world,
    selectIsland,
    closeDetailPanel,
    openQuiz,
    closeQuiz,
    startTour,
    stopTour,
    setViewMode
  };
}

bootstrap().catch(err => {
  console.error('[2026 清大福青蔬食浮島初始化錯誤]', err);
  const elStep = document.getElementById('introStepText');
  if (elStep) elStep.textContent = `載入發生例外：${err?.message || err}`;
});
