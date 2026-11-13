# K06-island-for-Gemini 核心工程模式與程式碼樣板庫

本文件收錄自「2026 清大福青社蔬食地圖（天空之城 3D 浮島）」歷經 24 個階段驗證之高幀率、零穿模、免編譯 Three.js 標準實作樣板。

---

## 一、 免編譯原生 ES Modules `importmap` 與無障礙現代 HUD 骨架（`island.html`）

無須 `node_modules` 或 Webpack / Vite 打包，直接相容本地靜態伺服器與 GitHub Pages；內建安全 Referrer 策略、語意地標、`safe-area-inset` 安全區、觸控熱區擴展與原生 `<dialog>` 覆蓋層規範：

```html
<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta name="color-scheme" content="light" />
  <title>3D 互動微縮探索群島</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <!-- 僅載入實際使用字重以縮減繁中字型請求體積；Google Fonts 依裝置回傳動態 CSS，故加 referrerpolicy 而非固定 SRI -->
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap" rel="stylesheet" referrerpolicy="no-referrer" />
  <link rel="stylesheet" href="./assets/island/island-map.css" />
  <link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>
  <!-- 頂端雙行品牌資訊卡（桌機與 360px 窄螢幕防折行、同頁開發日誌閉環導航） -->
  <header class="topbar">
    <div class="brand-card">
      <img src="./img/logo.png" alt="專案標誌" width="40" height="40" class="brand-logo" />
      <div class="brand-text">
        <div class="brand-title-row">
          <h1>專案主標題</h1>
          <span class="sky-pill">3D浮島</span>
          <a href="./about/project_dev.html" target="_parent" class="mobile-devlog-btn" id="btnMobileDevlog" aria-label="開發日誌"><span aria-hidden="true">ⓘ</span></a>
        </div>
        <div class="brand-sub">
          <span>核心主島 × 精選主題單元</span>
          <span class="brand-links">
            <a href="./index.html">返回首頁</a>
            <a href="./about/project_dev.html" target="_parent" class="desktop-devlog-link" id="btnDesktopDevlog"><span aria-hidden="true">ⓘ</span> 開發日誌</a>
          </span>
        </div>
      </div>
    </div>
  </header>

  <main id="islandMain">
    <canvas id="islandCanvas" role="region" aria-label="3D 互動微縮探索場景"></canvas>
    <!-- 2D 浮動名牌圖層：僅以 transform: translate3d(...) 定位 -->
    <div id="islandLabelsLayer" class="labels-layer"></div>
    <!-- 純文字篩選清單與桌面側欄／手機 Bottom Sheet（提供無障礙對等入口） -->
    <aside class="directory-panel" aria-label="主題單元文字目錄">
      <search>
        <label for="islandSearch" class="visually-hidden">搜尋主題單元</label>
        <input id="islandSearch" type="search" placeholder="搜尋主題或標籤" />
      </search>
    </aside>
    <nav class="bottom-dock" aria-label="探索工具列"></nav>
  </main>

  <!-- 阻塞型推薦測驗／拍貼預覽：採用原生 <dialog> + showModal() -->
  <dialog id="quizDialog" closedby="any" aria-labelledby="quizDialogTitle">
    <h2 id="quizDialogTitle">適性探索推薦</h2>
    <form method="dialog">
      <button type="submit" value="close" aria-label="關閉視窗">關閉</button>
    </form>
  </dialog>

  <script type="module" src="./assets/island/island-ui.js"></script>
  <!-- 可選擴充模組：獨立掛載不侵入主邏輯 -->
  <script type="module" src="./assets/island/island-dynamic-npc.js"></script>
  <script type="module" src="./assets/island-camera.js"></script>
</body>
</html>
```

### 手機窄螢幕（360 px～430 px）、安全區與原生覆蓋層關鍵 CSS
```css
:root {
  color-scheme: light;
  --target-size: 24px;
}

@media (pointer: coarse) {
  :root { --target-size: 44px; }
}

/* 同分頁切換開發日誌之漸進增強跨文件轉場 */
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
}

html, body, #islandMain {
  margin: 0;
  height: 100dvh;
  overflow: hidden;
}

.topbar {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  padding-top: max(10px, env(safe-area-inset-top, 0px));
  padding-inline: max(12px, env(safe-area-inset-left, 0px)) max(12px, env(safe-area-inset-right, 0px));
}

.bottom-dock {
  position: fixed;
  inset-block-end: 0;
  inset-inline: 0;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
  padding-inline: max(12px, env(safe-area-inset-left, 0px)) max(12px, env(safe-area-inset-right, 0px));
}

.brand-text {
  flex: 1;
  min-inline-size: 0;
}

.brand-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.brand-card h1 {
  margin: 0;
  font-size: clamp(0.875rem, 0.72rem + 1vw, 1rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-inline-size: 0;
}

.sky-pill {
  flex-shrink: 0;
  white-space: nowrap;
}

:where(a, button, input, select, [tabindex]):focus-visible {
  outline: 2px solid CanvasText;
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .brand-card {
    flex: 1;
    padding: 7px 11px;
    border-radius: 14px;
  }
  .desktop-devlog-link { display: none; }
  .mobile-devlog-btn {
    position: relative;
    margin-inline-start: auto;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  /* 維持 28px 精巧視覺外觀，於觸控螢幕擴展至 44x44px 熱區 */
  @media (pointer: coarse) {
    .mobile-devlog-btn::after {
      content: "";
      position: absolute;
      inset: -8px;
    }
  }
}

/* 原生 <dialog>：阻斷背景滾動鏈並支援 @starting-style 漸進入場 */
dialog:modal {
  overscroll-behavior: contain;
  opacity: 1;
  transition: opacity 0.25s ease-out, display 0.25s, overlay 0.25s;
  transition-behavior: allow-discrete;
}

dialog:modal::backdrop {
  overflow: hidden;
  overscroll-behavior: contain;
}

@starting-style {
  dialog:modal { opacity: 0; }
}

@media (forced-colors: active) {
  .brand-card, .sky-pill, dialog:modal { border: 1px solid CanvasText; }
}
```

---

## 二、 UTF-8 BOM 安全解碼、時區狀態判定與 XSS 防護（`island-data.js`）

針對 Windows 匯出之 TSV / CSV 強制以 `TextDecoder('utf-8')` 剝除 `\uFEFF` BOM 與 `\r\n`，提供離線備援常數與個資遮蔽過濾器；外部字串寫入 DOM 一律透過 `textContent` 防範 XSS，時區計算以 `Intl.DateTimeFormat` 明確指定 IANA 時區（不可手動加減本地 `Date` 偏移或使用不帶時區的 `Temporal.PlainDateTime`）：

```js
export function maskPersonalNames(text, pattern = /([陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱廖賴周徐蘇葉莊呂江何蕭羅高潘簡朱鍾彭游詹胡施沈余盧梁趙顏柯翁魏孫戴范方宋鄧杜傅侯曹薛丁卓馬阮唐董溫藍蔣石古紀姚連馮歐程湯黃田康姜白汪鄒尤巫鍾黎涂龔嚴韓袁金童陸夏柳邵])[〇○O＊*一-龥]{1,2}/g) {
  // 若資料源含未遮蔽榜單或公告姓名，上線前務必先於離線腳本預先遮蔽為「李OO」，嚴禁將未遮蔽原始檔推上公開 GitHub
  return text.replace(pattern, '$1OO');
}

export async function loadTsvWithFallback(url, fallbackRows) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const raw = new TextDecoder('utf-8').decode(buf).replace(/^\uFEFF/, '');
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return fallbackRows;
    const headers = lines[0].split('\t').map(h => h.trim());
    return lines.slice(1).map(line => {
      const cols = line.split('\t').map(c => c.trim());
      return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? '']));
    });
  } catch {
    return fallbackRows;
  }
}

export function getZonedClock(timeZone = 'Asia/Taipei', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const pick = (type) => parts.find(p => p.type === type)?.value ?? '';
  return {
    weekday: pick('weekday'),
    minutesOfDay: Number(pick('hour')) * 60 + Number(pick('minute')),
  };
}

// 渲染外部 TSV/API 文字至 DOM 時，嚴禁使用 innerHTML 字串拼接
export function createSafeBadge(text, className = 'pill') {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}
```

---

## 三、 頂點色同材質靜態零件幾何合併器（`bakeStaticGroup`）

將每座浮島／節點內未標記 `userData.dyn = true` 之數千個靜態積木零件，依平滑／平面著色寫入頂點色並合併為極少數 `BufferGeometry`（實測 `1,402` 個零件壓縮為 `78` 個 Mesh，縮減率 `94.44%`），同時關閉合併網格之 `raycast` 改由單一八角包圍碰撞體負責極速滑鼠拾取：

```js
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const NOOP_RAYCAST = () => {};
const bakedSmoothMat = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.78, metalness: 0.02 });
const bakedFlatMat = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, flatShading: true, roughness: 0.78, metalness: 0.02 });

export function bakeStaticGroup(rootGroup, metrics = null) {
  rootGroup.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(rootGroup.matrixWorld).invert();
  const buckets = new Map();
  const staticMeshes = [];

  function collect(node) {
    if (node.userData?.dyn || node.userData?.noMerge) return;
    if (node.isMesh && node.visible && !Array.isArray(node.material)) {
      const srcGeo = node.geometry;
      const g = srcGeo.index ? srcGeo.toNonIndexed() : srcGeo.clone();
      const m = node.material;
      const useVCol = m?.isMeshStandardMaterial && !m.map && !m.transparent && m.emissiveIntensity <= 0.06;
      const targetMat = useVCol ? (m.flatShading ? bakedFlatMat : bakedSmoothMat) : m;
      const keep = useVCol ? ['position', 'normal', 'color'] : targetMat.map ? ['position', 'normal', 'uv'] : ['position', 'normal'];

      for (const attr of Object.keys(g.attributes)) {
        if (!keep.includes(attr)) g.deleteAttribute(attr);
      }
      if (!g.attributes.normal) g.computeVertexNormals();
      if (useVCol) {
        const count = g.attributes.position.count;
        const cols = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          cols[i * 3] = m.color.r;
          cols[i * 3 + 1] = m.color.g;
          cols[i * 3 + 2] = m.color.b;
        }
        g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      }

      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(invRoot, node.matrixWorld));
      if (!buckets.has(targetMat)) buckets.set(targetMat, { geos: [], cast: false, receive: false });
      const b = buckets.get(targetMat);
      b.geos.push(g);
      b.cast = b.cast || node.castShadow;
      b.receive = b.receive || node.receiveShadow;
      staticMeshes.push(node);
    }
    for (const child of node.children) collect(child);
  }

  for (const child of [...rootGroup.children]) collect(child);
  if (metrics) metrics.rawStaticMeshes += staticMeshes.length;

  buckets.forEach((b, material) => {
    const mergedGeo = mergeGeometries(b.geos, false);
    b.geos.forEach(g => g.dispose());
    if (!mergedGeo) return;
    const mesh = new THREE.Mesh(mergedGeo, material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.matrixAutoUpdate = false;
    mesh.raycast = NOOP_RAYCAST;
    mesh.userData.noMerge = true;
    rootGroup.add(mesh);
    if (metrics) metrics.mergedStaticMeshes += 1;
  });

  staticMeshes.forEach(m => m.parent?.remove(m));
}
```

> **效能遙測與長任務讓渡規範**：務必於全域掛載 `window.__ISLAND_METRICS__ = { rawStaticMeshes, mergedStaticMeshes, reductionPct, drawCalls }`，供 `scripts/audit_island_e2e.py` 自動斷言檢驗靜態合併率 ≥ 75%。若批次建立多座浮島幾何耗時超過 `50 ms`，於每座島建置間呼叫 `yieldToMain()` 避免阻塞首屏互動（INP）：
>
> ```js
> export function yieldToMain() {
>   if ('scheduler' in window && 'yield' in scheduler) return scheduler.yield();
>   return new Promise(resolve => setTimeout(resolve, 0));
> }
> ```

---

## 四、 移軸微縮後製與行動端自動省電降級

```js
export function shouldEnableTiltShiftByDefault() {
  const isMobileViewport = window.innerWidth <= 768;
  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  return !(isMobileViewport || isCoarsePointer);
}
```

- 桌機預設啟用 `EffectComposer`（`RenderPass` → `TiltShiftShaderPass` → `OutputPass`），上下邊緣柔和景深模糊 + 微幅提升飽和度（`1.08`）。
- 手機／平板預設直出 `renderer.render(scene, camera)`，節省 40% 以上 GPU 填充率與電力，並於底部工具列提供「移軸微縮」手動切換鈕。

---

## 五、 防穿模與動態暫停三大保護模式

### 1. 常駐 NPC 掛載於浮島本地座標系（根治浮島呼吸起伏淹沒腳踝）
```js
// 錯誤做法：scene.add(npc) -> 當 islandRoot.position.y 隨正弦波上升 +0.14 時，草地直接淹過小人腳踝
// 正確做法：掛載至 islandRoot 本地空間，完全同步懸浮呼吸與 Hover 抬升
npcGroup.userData.dyn = true;
npcGroup.position.set(localX, 0.045, localZ);
islandRoot.add(npcGroup);
```

### 2. 跨島巡航吉祥物地面高度守衛（`Elevation Guard`）
```js
export function applyElevationGuard(worldPos, islandsMeta, clearance = 0.05) {
  for (const isl of islandsMeta) {
    const dx = worldPos.x - isl.x;
    const dz = worldPos.z - isl.z;
    if (dx * dx + dz * dz <= isl.safeRadius * isl.safeRadius) {
      const minSurfaceY = isl.currentY + clearance;
      if (worldPos.y < minSurfaceY) worldPos.y = minSurfaceY;
    }
  }
  return worldPos;
}
```

### 3. 系統減動偏好、背景分頁暫停與時間戳鎖定（防止恢復時暴衝瞬移）
```js
const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
window.__ISLAND_UI_STATE__ = window.__ISLAND_UI_STATE__ || { animate: !reducedMotionMQ.matches };
reducedMotionMQ.addEventListener('change', (e) => {
  window.__ISLAND_UI_STATE__.animate = !e.matches;
});

let lastTime = performance.now();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) lastTime = performance.now();
});

function tick(now) {
  requestAnimationFrame(tick);
  // 暫停或處於背景分頁期間持續同步時間戳，恢復瞬間 dt 維持平滑 ~16ms 並節省 GPU 電量
  if (document.hidden || !window.__ISLAND_UI_STATE__?.animate) {
    lastTime = now;
    return;
  }
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updateDynamicEntities(dt);
}
```

### 4. 2D 浮動名牌合成層整數像素位移（防抖動與 Layout Thrashing）
```js
// 嚴禁於動畫迴圈修改 el.style.left / el.style.top 或交錯讀寫 getBoundingClientRect()
export function positionFloatingLabel(el, x, y) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
}
```

---

## 六、 一鍵美照拍貼機純淨擷取與 4 角浮水印合成（`island-camera.js`）

不依賴 `html2canvas`（避免破圖與 UI 雜訊），直接強制重繪一幀 WebGL 畫布並於離屏 2D Canvas 合成 4 角可切換毛玻璃品牌徽章：

```js
export function capturePureWebGLWithWatermark({ renderer, renderOneFrame, logoImg, titleText, subText, corner = 'top-right' }) {
  // 1. 立即觸發單幀繪製，確保即使未設 preserveDrawingBuffer 也能取得完整像素
  renderOneFrame();
  const glCanvas = renderer.domElement;
  const out = document.createElement('canvas');
  out.width = glCanvas.width;
  out.height = glCanvas.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(glCanvas, 0, 0);

  // 2. 依畫布寬度自適應計算膠囊浮水印尺寸與四角座標 (top-left | top-right | bottom-left | bottom-right)
  const scale = Math.max(0.75, Math.min(1.6, out.width / 1440));
  const pad = Math.round(24 * scale);
  const boxW = Math.round(310 * scale);
  const boxH = Math.round(74 * scale);
  const x = corner.endsWith('right') ? out.width - boxW - pad : pad;
  const y = corner.startsWith('bottom') ? out.height - boxH - pad : pad;

  ctx.save();
  ctx.fillStyle = 'rgba(253, 250, 243, 0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, Math.round(18 * scale));
  ctx.fill();
  // 繪製吉祥物圖示與雙行品牌文字...
  ctx.restore();
  return out.toDataURL('image/png');
}
```
