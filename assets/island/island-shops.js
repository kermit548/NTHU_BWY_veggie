// 2026 清大福青社蔬食地圖 — 10 座蔬食餐廳主題浮島積木建模、招牌料理微縮展示與天空之城動態彩蛋
// 100% 純程式碼基本幾何拼裝（零外部 GLTF/FBX），靜態零件自動由 island-world.js 合併為同材質 BufferGeometry。

import * as THREE from 'three';
import {
  getCachedGeo,
  mat,
  glowWindowMat,
  makeBox,
  makeCyl,
  makeSphere,
  makeCone,
  makeIco,
  makeTorus,
  makeGableRoof,
  makeSignBoard
} from './island-world.js';
import {
  createLushTree,
  createPineTree,
  createParkLamp,
  createMiniPerson,
  createBridgeCyclist,
  createInteractiveCritter
} from './island-landmarks.js';

// ============================================================================
// 1. 共用微縮餐飲、建築外殼與熱氣蒸氣積木元件
// ============================================================================

/**
 * 動態上升熱氣白煙球（用於湯麵、鐵板素排、砂鍋煲與竹蒸籠，標記 userData.dyn 排除靜態合併）
 */
function createRisingSteam(pos = [0, 0, 0], seed = 0, registerAnim) {
  const g = new THREE.Group();
  g.userData.dyn = true;
  g.position.set(pos[0], pos[1], pos[2]);

  const puffs = [0, 1, 2].map(idx => {
    const m = makeSphere(0.065, '#ffffff', {
      seg: 8,
      pos: [0, idx * 0.14, 0],
      castShadow: false,
      receiveShadow: false
    });
    g.add(m);
    return m;
  });

  if (registerAnim) {
    registerAnim(elapsed => {
      puffs.forEach((p, idx) => {
        const t = (elapsed * 0.72 + seed + idx * 0.33) % 1;
        p.position.y = t * 0.48;
        p.position.x = Math.sin(elapsed * 2.1 + idx + seed) * 0.05 * t;
        const s = Math.sin(t * Math.PI) * 1.15;
        p.scale.setScalar(Math.max(0.01, s));
      });
    });
  }
  return g;
}

/**
 * 建立微縮湯麵 / 蓋飯瓷碗與竹筷
 */
function createCeramicBowl({
  r = 0.34,
  bowlColor = '#fff7eb',
  rimColor = '#c84b31',
  brothColor = '#6b2d1a',
  withChopsticks = true,
  pos = [0, 0, 0]
}) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);

  const h = r * 0.72;
  g.add(makeCyl(r * 0.56, r * 0.5, 0.05, bowlColor, { seg: 14, pos: [0, 0.025, 0] }));
  g.add(makeCyl(r, r * 0.58, h, bowlColor, { seg: 16, pos: [0, 0.05 + h / 2, 0] }));
  g.add(makeTorus(r * 0.98, 0.022, rimColor, { seg: 16, pos: [0, 0.05 + h, 0], rot: [Math.PI / 2, 0, 0] }));
  g.add(makeCyl(r * 0.9, r * 0.88, 0.04, brothColor, { seg: 14, pos: [0, 0.03 + h * 0.86, 0] }));

  if (withChopsticks) {
    const y = 0.07 + h;
    g.add(makeCyl(0.012, 0.009, r * 2.35, '#c78d4e', { seg: 6, pos: [0.04, y, 0.04], rot: [0.05, 0.25, Math.PI / 2.08] }));
    g.add(makeCyl(0.012, 0.009, r * 2.35, '#c78d4e', { seg: 6, pos: [0.04, y, -0.03], rot: [-0.04, 0.2, Math.PI / 2.08] }));
  }
  return { group: g, topY: 0.05 + h * 0.9 };
}

/**
 * 戶外木質圓餐桌、圓凳與遮陽傘
 */
function createPatioSet({ pos = [0, 0, 0], umbrellaColor = null, tableColor = '#d49b63' }) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.add(makeCyl(0.05, 0.07, 0.42, '#7a5638', { seg: 8, pos: [0, 0.21, 0] }));
  g.add(makeCyl(0.42, 0.42, 0.055, tableColor, { seg: 12, pos: [0, 0.44, 0] }));

  for (const [sx, sz] of [[-0.56, 0.08], [0.56, -0.06]]) {
    g.add(makeCyl(0.14, 0.12, 0.24, '#e6cfa8', { seg: 10, pos: [sx, 0.12, sz] }));
  }

  if (umbrellaColor) {
    g.add(makeCyl(0.025, 0.025, 1.18, '#6e5239', { seg: 6, pos: [0, 0.98, 0] }));
    g.add(makeCone(0.68, 0.34, umbrellaColor, { seg: 8, pos: [0, 1.56, 0] }));
  }
  return g;
}

/**
 * 傳統夜間發光紅燈籠
 */
function createLantern(pos = [0, 0, 0], bodyColor = '#d6422f') {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.add(makeCyl(0.05, 0.05, 0.04, '#dca743', { seg: 8, pos: [0, 0.13, 0] }));
  g.add(makeSphere(0.11, bodyColor, { seg: 10, scale: [0.92, 1.15, 0.92], pos: [0, 0, 0] }));
  g.add(makeSphere(0.07, '#fbe8a8', { seg: 8, material: glowWindowMat, pos: [0, 0, 0.05], castShadow: false }));
  g.add(makeCyl(0.045, 0.045, 0.04, '#dca743', { seg: 8, pos: [0, -0.13, 0] }));
  return g;
}

/**
 * 標準微縮餐廳建築主體（含地基、圓角牆體、夜間發光窗、門框、遮陽棚、屋頂與高解析店名招牌）
 */
function createShopBuilding({
  w = 2.45,
  h = 1.58,
  d = 1.72,
  wallColor = '#faf2e3',
  roofColor = '#4a8584',
  roofStyle = 'gable',
  trimColor = '#7d5638',
  awningA = '#4a8584',
  awningB = '#fff7e8',
  signText = '蔬食館',
  signBg = '#2c4a47',
  pos = [0, 0.04, -0.78],
  rotY = 0
}) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = rotY;

  // 石材地基與主牆
  g.add(makeBox([w + 0.18, 0.12, d + 0.18], '#bfb5a4', { r: 0.03, pos: [0, 0.06, 0] }));
  g.add(makeBox([w, h, d], wallColor, { r: 0.06, pos: [0, 0.12 + h / 2, 0] }));

  // 店門與兩側夜間暖光玻璃窗
  const frontZ = d / 2 + 0.015;
  g.add(makeBox([0.52, 0.96, 0.06], trimColor, { r: 0.02, pos: [0, 0.6, frontZ] }));
  g.add(makeBox([0.4, 0.84, 0.07], '#fbe8a8', { material: glowWindowMat, pos: [0, 0.6, frontZ + 0.008], castShadow: false }));

  for (const wx of [-w * 0.31, w * 0.31]) {
    g.add(makeBox([0.54, 0.54, 0.05], trimColor, { r: 0.02, pos: [wx, 0.82, frontZ] }));
    g.add(makeBox([0.44, 0.44, 0.065], '#fbe8a8', { material: glowWindowMat, pos: [wx, 0.82, frontZ + 0.008], castShadow: false }));
  }

  // 側窗（讓旋轉 360 度皆有夜間燈火細節）
  for (const sx of [-w / 2 - 0.012, w / 2 + 0.012]) {
    g.add(makeBox([0.05, 0.48, 0.62], '#fbe8a8', { material: glowWindowMat, pos: [sx, 0.84, 0], castShadow: false }));
  }

  // 條紋遮陽雨棚
  const stripeCount = 5;
  const sw = (w * 0.92) / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    const sx = -w * 0.46 + (i + 0.5) * sw;
    g.add(
      makeBox([sw * 0.98, 0.08, 0.44], i % 2 === 0 ? awningA : awningB, {
        r: 0.015,
        pos: [sx, 1.24, frontZ + 0.18],
        rot: [0.22, 0, 0]
      })
    );
  }

  // 屋頂造型變化
  const roofY = 0.12 + h;
  if (roofStyle === 'gable') {
    g.add(makeGableRoof(w + 0.28, 0.62, d + 0.28, roofColor, { pos: [0, roofY - 0.02, 0] }));
  } else if (roofStyle === 'flat') {
    g.add(makeBox([w + 0.22, 0.16, d + 0.22], roofColor, { r: 0.04, pos: [0, roofY + 0.06, 0] }));
    g.add(makeBox([w * 0.78, 0.14, d * 0.72], trimColor, { r: 0.03, pos: [0, roofY + 0.18, 0] }));
  } else if (roofStyle === 'pavilion') {
    // 雙層校園餐廳風格（風雲樓 / 交大二餐）
    g.add(makeBox([w * 0.92, 0.78, d * 0.88], wallColor, { r: 0.05, pos: [0, roofY + 0.36, -0.04] }));
    g.add(makeBox([w * 0.76, 0.42, 0.06], '#fbe8a8', { material: glowWindowMat, pos: [0, roofY + 0.38, d * 0.44], castShadow: false }));
    g.add(makeBox([w + 0.18, 0.16, d + 0.14], roofColor, { r: 0.04, pos: [0, roofY + 0.8, -0.04] }));
  }

  // 店名立體招牌
  const signY = roofStyle === 'pavilion' ? roofY + 0.98 : roofY + 0.36;
  const signZ = roofStyle === 'gable' ? d / 2 + 0.16 : d / 2 + 0.08;
  g.add(makeSignBoard(signText, signBg, '#fffaf2', 0.3, [0, signY, signZ]));

  return g;
}

/**
 * 鋪設從中央清華主島橋頭延伸至店前庭院之迎賓踏石步道，並自動避開橋頭種植周邊綠樹
 */
function decorateShopGrounds(group, island) {
  const R = island.islandRadius || 3.75;
  const toHubAngle = Math.atan2(-island.x, -island.z);
  const ux = Math.sin(toHubAngle);
  const uz = Math.cos(toHubAngle);

  // 店前暖灰圓形石板小庭院
  group.add(makeCyl(1.75, 1.8, 0.035, '#cfc5b4', { seg: 14, pos: [0, 0.018, 0.55] }));

  // 連接雲橋橋頭之踏石小徑
  for (let i = 1; i <= 4; i++) {
    const dist = 1.15 + i * ((R - 1.55) / 4);
    group.add(
      makeCyl(0.24, 0.26, 0.04, i % 2 === 0 ? '#bfb4a2' : '#d8cebc', {
        seg: 8,
        pos: [ux * dist, 0.02, uz * dist]
      })
    );
  }

  // 周邊植栽與暖光小路燈（自動避開正面視線 +Z 與雲橋入口角度）
  const treeCandidates = [
    [-2.45, -1.35, 'lush', 0.88],
    [2.48, -1.25, 'pine', 0.92],
    [-2.65, 0.85, 'pine', 0.82],
    [2.62, 0.78, 'lush', 0.8]
  ];
  for (const [tx, tz, kind, sc] of treeCandidates) {
    const a = Math.atan2(tx, tz);
    const diff = Math.atan2(Math.sin(a - toHubAngle), Math.cos(a - toHubAngle));
    if (Math.abs(diff) < 0.42) continue;
    group.add(kind === 'pine' ? createPineTree([tx, 0, tz], sc) : createLushTree([tx, 0, tz], sc));
  }

  group.add(createParkLamp([-2.05, 0.02, 1.55]));
}

// ============================================================================
// 2. 10 座蔬食餐廳主題浮島專屬建築與招牌料理建模
// ============================================================================

export function buildShopIslandScene(group, { island, registerAnim, registerCritter }) {
  decorateShopGrounds(group, island);
  const subtleYaw = Math.atan2(island.x, Math.abs(island.z) + 22) * 0.28;
  const signBg = island.ring === 'inner' ? '#2c4a47' : '#d96b27';

  // 招牌料理展示木檯（擺放於店前庭院右側，微縮特寫一目了然）
  const dishPedestal = new THREE.Group();
  dishPedestal.position.set(1.12, 0.04, 1.18);
  dishPedestal.add(makeBox([1.15, 0.42, 0.86], '#d9b382', { r: 0.04, pos: [0, 0.21, 0] }));
  dishPedestal.add(makeBox([1.24, 0.06, 0.94], '#9c6b3f', { r: 0.02, pos: [0, 0.44, 0] }));
  group.add(dishPedestal);

  let critterKind = 'squirrel';
  let critterSpeech = `${island.short}：${island.dishes[0] || '超人氣蔬食'}必吃！`;

  switch (island.id) {
    case 'yasuzhai': {
      // #1 雅素齋自然人文蔬食館：溫潤木質茶屋 + 養生藥膳麵 & 招牌冰鎮滷味
      const b = createShopBuilding({
        wallColor: '#f5ead6',
        roofColor: '#365e59',
        trimColor: '#6e492d',
        awningA: '#365e59',
        awningB: '#f5ead6',
        signText: '雅素齋',
        signBg,
        rotY: subtleYaw
      });
      b.add(createLantern([-1.05, 1.18, 1.05], '#d97a38'));
      b.add(createLantern([1.05, 1.18, 1.05], '#d97a38'));
      group.add(b);

      const bowl = createCeramicBowl({ r: 0.34, brothColor: '#3d2114', rimColor: '#365e59', pos: [-0.24, 0.47, 0] });
      // 金黃麵條、紅枸杞與青江菜
      bowl.group.add(makeSphere(0.18, '#e8c468', { scale: [1.1, 0.38, 1.0], pos: [0, bowl.topY + 0.01, 0] }));
      bowl.group.add(makeSphere(0.035, '#d93829', { pos: [0.08, bowl.topY + 0.05, 0.05] }));
      bowl.group.add(makeSphere(0.035, '#d93829', { pos: [-0.06, bowl.topY + 0.05, -0.04] }));
      bowl.group.add(makeBox([0.14, 0.05, 0.08], '#4f9e48', { r: 0.02, pos: [-0.1, bowl.topY + 0.04, 0.08] }));
      dishPedestal.add(bowl.group);
      dishPedestal.add(createRisingSteam([-0.24, 0.85, 0], 1.1, registerAnim));

      // 招牌冰鎮滷味木拼盤
      dishPedestal.add(makeCyl(0.24, 0.22, 0.04, '#734d2d', { seg: 12, pos: [0.32, 0.49, 0.04] }));
      dishPedestal.add(makeBox([0.11, 0.07, 0.11], '#b87a44', { r: 0.02, pos: [0.26, 0.54, 0.02] }));
      dishPedestal.add(makeBox([0.11, 0.07, 0.11], '#c98e54', { r: 0.02, pos: [0.38, 0.54, 0.08] }));
      dishPedestal.add(makeCyl(0.055, 0.055, 0.06, '#3b5238', { seg: 8, pos: [0.33, 0.54, -0.07] }));

      group.add(createPatioSet({ pos: [-1.15, 0.04, 1.2], umbrellaColor: '#4a8584' }));
      critterKind = 'squirrel';
      critterSpeech = '雅素齋的藥膳湯頭溫潤回甘，冰鎮滷味更是清大生必點！';
      break;
    }

    case 'miaoguanyin': {
      // #2 妙觀音素食：暖紅中式麵館 + 雙紅燈籠 + 招牌紅燒麵 & 酸辣湯
      const b = createShopBuilding({
        wallColor: '#fbf0df',
        roofColor: '#b84a39',
        trimColor: '#7a3426',
        awningA: '#b84a39',
        awningB: '#fff6e8',
        signText: '妙觀音素食',
        signBg,
        rotY: subtleYaw
      });
      b.add(createLantern([-0.98, 1.16, 1.06], '#d93b2b'));
      b.add(createLantern([0.98, 1.16, 1.06], '#d93b2b'));
      group.add(b);

      const braisedBowl = createCeramicBowl({ r: 0.36, brothColor: '#8f2d19', rimColor: '#b84a39', pos: [-0.22, 0.47, 0] });
      braisedBowl.group.add(makeSphere(0.17, '#f0cb75', { scale: [1.1, 0.35, 1.0], pos: [0, braisedBowl.topY + 0.01, 0] }));
      braisedBowl.group.add(makeBox([0.11, 0.07, 0.09], '#613822', { r: 0.02, pos: [0.1, braisedBowl.topY + 0.04, 0.04] }));
      braisedBowl.group.add(makeCyl(0.05, 0.05, 0.05, '#e66c2c', { seg: 8, pos: [-0.1, braisedBowl.topY + 0.04, 0.06] }));
      braisedBowl.group.add(makeSphere(0.05, '#4ea346', { pos: [0, braisedBowl.topY + 0.05, -0.08] }));
      dishPedestal.add(braisedBowl.group);
      dishPedestal.add(createRisingSteam([-0.22, 0.86, 0], 2.3, registerAnim));

      const soupBowl = createCeramicBowl({ r: 0.22, brothColor: '#b8682e', rimColor: '#d98a3c', withChopsticks: false, pos: [0.34, 0.47, 0.05] });
      soupBowl.group.add(makeBox([0.12, 0.03, 0.03], '#fff8eb', { pos: [0, soupBowl.topY + 0.02, 0] }));
      dishPedestal.add(soupBowl.group);

      group.add(createPatioSet({ pos: [-1.12, 0.04, 1.15], umbrellaColor: '#b84a39' }));
      critterKind = 'panda';
      critterSpeech = '過馬路四分鐘就到妙觀音！全素紅燒麵配酸辣湯超滿足！';
      break;
    }

    case 'amushi': {
      // #3 安姆士：清新薄荷綠輕食茶飲吧 + 巨型漸層水果奶茶杯 & 養生拌飯
      const b = createShopBuilding({
        wallColor: '#f2faf8',
        roofColor: '#3e8e89',
        roofStyle: 'flat',
        trimColor: '#2d6662',
        awningA: '#3e8e89',
        awningB: '#ffffff',
        signText: '安姆士',
        signBg,
        rotY: subtleYaw
      });
      group.add(b);

      // 漸層水果奶茶透明感立體杯 + 綠色吸管 + 柳橙片
      const cup = new THREE.Group();
      cup.position.set(0.26, 0.47, 0);
      cup.add(makeCyl(0.16, 0.125, 0.22, '#f2b880', { seg: 14, pos: [0, 0.11, 0] }));
      cup.add(makeCyl(0.185, 0.16, 0.24, '#f7d9a8', { seg: 14, pos: [0, 0.34, 0] }));
      cup.add(makeSphere(0.185, '#fff9ee', { seg: 12, thetaLength: Math.PI * 0.5, pos: [0, 0.46, 0] }));
      cup.add(makeCyl(0.022, 0.022, 0.36, '#49a368', { seg: 8, pos: [0.05, 0.58, 0], rot: [0, 0, -0.22] }));
      cup.add(makeCyl(0.075, 0.075, 0.025, '#f28c28', { seg: 10, pos: [-0.14, 0.48, 0.06], rot: [0.3, 0, 0.8] }));
      dishPedestal.add(cup);

      // 五彩養生拌飯碗
      const riceBowl = createCeramicBowl({ r: 0.29, brothColor: '#f7f2e6', rimColor: '#3e8e89', pos: [-0.26, 0.47, 0.04] });
      riceBowl.group.add(makeSphere(0.07, '#58ad4e', { pos: [-0.08, riceBowl.topY + 0.03, 0.05] }));
      riceBowl.group.add(makeSphere(0.065, '#f2c138', { pos: [0.08, riceBowl.topY + 0.03, 0.05] }));
      riceBowl.group.add(makeSphere(0.065, '#8c4b8e', { pos: [0, riceBowl.topY + 0.03, -0.08] }));
      dishPedestal.add(riceBowl.group);

      group.add(createPatioSet({ pos: [-1.15, 0.04, 1.18], umbrellaColor: '#3e8e89' }));
      critterKind = 'squirrel';
      critterSpeech = '安姆士銅板價就能享受到清爽養生拌飯跟水果奶茶！';
      break;
    }

    case 'zaozishu': {
      // #4 棗子樹：結滿紅棗果實的庭園小館 + 鐵板金黃蛋煎粄條
      const b = createShopBuilding({
        wallColor: '#f8f0e0',
        roofColor: '#568c47',
        trimColor: '#6e4e32',
        awningA: '#568c47',
        awningB: '#fff8ec',
        signText: '棗子樹',
        signBg,
        rotY: subtleYaw
      });
      group.add(b);

      // 店旁專屬結實累累的「紅棗樹」
      const jujubeTree = createLushTree([-1.58, 0, 0.62], 1.05, '#4e9945');
      for (const [jx, jy, jz] of [[-0.25, 1.22, 0.35], [0.22, 1.32, 0.32], [0.35, 1.15, -0.1], [-0.15, 1.45, 0.18], [0.08, 1.12, 0.42]]) {
        jujubeTree.add(makeSphere(0.055, '#c9382b', { seg: 8, scale: [0.85, 1.2, 0.85], pos: [jx, jy, jz] }));
      }
      group.add(jujubeTree);

      // 招牌金黃酥香蛋煎粄條鐵盤 + 素書香麵
      dishPedestal.add(makeCyl(0.32, 0.3, 0.045, '#2b2d2f', { seg: 14, pos: [-0.2, 0.49, 0.02] }));
      dishPedestal.add(makeBox([0.22, 0.06, 0.16], '#e8b64c', { r: 0.02, pos: [-0.26, 0.54, -0.02], rot: [0, 0.2, 0] }));
      dishPedestal.add(makeBox([0.22, 0.06, 0.16], '#f0c45d', { r: 0.02, pos: [-0.13, 0.56, 0.06], rot: [0, -0.25, 0] }));
      dishPedestal.add(makeSphere(0.04, '#4e9e47', { pos: [-0.18, 0.59, 0.02] }));

      const noodle = createCeramicBowl({ r: 0.22, brothColor: '#6e3f24', rimColor: '#568c47', withChopsticks: false, pos: [0.33, 0.47, 0.02] });
      dishPedestal.add(noodle.group);

      critterKind = 'panda';
      critterSpeech = '建新路棗子樹的招牌蛋煎粄條外酥內軟，老饕最愛！';
      break;
    }

    case 'dingsheng': {
      // #5 鼎盛蔬食便當（清大校內風雲樓 2 樓）：雙層校園餐廳大樓 + 多格豐盛手作蔬食便當盒
      const b = createShopBuilding({
        w: 2.68,
        h: 1.45,
        d: 1.78,
        wallColor: '#eee8dc',
        roofColor: '#6d4c93', // 清華紫屋頂識別
        roofStyle: 'pavilion',
        trimColor: '#573d75',
        awningA: '#6d4c93',
        awningB: '#f7f2fa',
        signText: '鼎盛蔬食',
        signBg,
        rotY: subtleYaw
      });
      group.add(b);

      // 巨型四格木質手作蔬食便當盒
      const bento = new THREE.Group();
      bento.position.set(0, 0.48, 0);
      bento.add(makeBox([0.86, 0.11, 0.64], '#c9935b', { r: 0.02, pos: [0, 0.055, 0] }));
      bento.add(makeBox([0.82, 0.08, 0.03], '#9c6b3b', { pos: [0, 0.09, 0] }));
      bento.add(makeBox([0.03, 0.08, 0.6], '#9c6b3b', { pos: [0.06, 0.09, 0] }));
      // 白飯 + 黑芝麻、青花菜、紅燒豆腐、金黃地瓜天婦羅
      bento.add(makeBox([0.4, 0.06, 0.25], '#fffdf7', { r: 0.02, pos: [-0.18, 0.1, 0.15] }));
      bento.add(makeSphere(0.025, '#222222', { pos: [-0.18, 0.135, 0.15] }));
      bento.add(makeIco(0.085, '#479948', { pos: [-0.22, 0.13, -0.14] }));
      bento.add(makeIco(0.075, '#58ad52', { pos: [-0.08, 0.13, -0.15] }));
      bento.add(makeBox([0.24, 0.07, 0.22], '#c46835', { r: 0.02, pos: [0.24, 0.11, -0.14] }));
      bento.add(makeCyl(0.08, 0.08, 0.05, '#f0b840', { seg: 10, pos: [0.24, 0.11, 0.15] }));
      dishPedestal.add(bento);

      group.add(createPatioSet({ pos: [-1.18, 0.04, 1.18], umbrellaColor: '#6d4c93' }));
      critterKind = 'squirrel';
      critterSpeech = '就在清大風雲樓二樓！下課直衝鼎盛買手作蔬食便當最方便！';
      break;
    }

    case 'mansuyuan': {
      // 單車圈 #1 滿素圓：溫馨橘瓦小館 + 紅油抄手碗 & 木盒便當
      const b = createShopBuilding({
        wallColor: '#fbf2e4',
        roofColor: '#d96b27',
        trimColor: '#824924',
        awningA: '#ea7a2e',
        awningB: '#fff8ec',
        signText: '滿素圓',
        signBg,
        rotY: subtleYaw
      });
      group.add(b);

      const wontonBowl = createCeramicBowl({ r: 0.32, brothColor: '#b8371d', rimColor: '#ea7a2e', pos: [-0.24, 0.47, 0] });
      for (const [wx, wz] of [[-0.08, 0.04], [0.08, 0.05], [0, -0.07]]) {
        wontonBowl.group.add(makeSphere(0.075, '#faf0d7', { scale: [1.15, 0.72, 0.9], pos: [wx, wontonBowl.topY + 0.03, wz] }));
      }
      dishPedestal.add(wontonBowl.group);

      // 精緻雙格便當盒
      dishPedestal.add(makeBox([0.42, 0.1, 0.34], '#cfa06b', { r: 0.02, pos: [0.28, 0.52, 0.02] }));
      dishPedestal.add(makeBox([0.17, 0.05, 0.28], '#fffcf5', { r: 0.015, pos: [0.19, 0.56, 0.02] }));
      dishPedestal.add(makeBox([0.17, 0.05, 0.28], '#63a84e', { r: 0.015, pos: [0.37, 0.56, 0.02] }));

      group.add(createPatioSet({ pos: [-1.1, 0.04, 1.15], umbrellaColor: '#ea7a2e' }));
      critterKind = 'panda';
      critterSpeech = '金城一路滿素圓！平日限定的抄手、酸辣湯與家常便當超暖心！';
      break;
    }

    case 'yixiansu': {
      // 單車圈 #2 一鮮素素食小館：熱炒鐵板小館 + 滋滋冒煙鑄鐵盤素排 & 砂鍋臭豆腐煲
      const b = createShopBuilding({
        wallColor: '#f8eee0',
        roofColor: '#c85328',
        trimColor: '#6e341d',
        awningA: '#c85328',
        awningB: '#fff6ea',
        signText: '一鮮素',
        signBg,
        rotY: subtleYaw
      });
      group.add(b);

      // 木底座橢圓黑色鑄鐵盤 + 鐵板素排 + 玉米青花菜配菜
      dishPedestal.add(makeCyl(0.32, 0.32, 0.035, '#a86e3e', { seg: 14, pos: [-0.23, 0.49, 0.02] }));
      dishPedestal.add(makeCyl(0.28, 0.27, 0.04, '#232528', { seg: 14, pos: [-0.23, 0.52, 0.02] }));
      dishPedestal.add(makeBox([0.28, 0.075, 0.18], '#6e351f', { r: 0.03, pos: [-0.25, 0.57, 0.03] }));
      dishPedestal.add(makeSphere(0.05, '#f2c230', { pos: [-0.12, 0.56, -0.08] }));
      dishPedestal.add(makeIco(0.055, '#4ca348', { pos: [-0.36, 0.56, -0.07] }));
      dishPedestal.add(createRisingSteam([-0.23, 0.66, 0.02], 3.7, registerAnim));

      // 雙耳陶土砂鍋臭豆腐煲
      const pot = new THREE.Group();
      pot.position.set(0.3, 0.47, 0.02);
      pot.add(makeCyl(0.22, 0.17, 0.2, '#8c5438', { seg: 14, pos: [0, 0.1, 0] }));
      pot.add(makeTorus(0.06, 0.018, '#6e3f28', { pos: [-0.21, 0.15, 0], rot: [0, 0, Math.PI / 2] }));
      pot.add(makeTorus(0.06, 0.018, '#6e3f28', { pos: [0.21, 0.15, 0], rot: [0, 0, Math.PI / 2] }));
      pot.add(makeCyl(0.19, 0.19, 0.03, '#c45b28', { seg: 12, pos: [0, 0.19, 0] }));
      pot.add(makeBox([0.1, 0.07, 0.1], '#e3b268', { r: 0.015, pos: [-0.04, 0.22, 0.02] }));
      pot.add(makeBox([0.1, 0.07, 0.1], '#e3b268', { r: 0.015, pos: [0.06, 0.22, -0.03] }));
      dishPedestal.add(pot);

      group.add(createPatioSet({ pos: [-1.12, 0.04, 1.15], umbrellaColor: '#c85328' }));
      critterKind = 'squirrel';
      critterSpeech = '滋滋作響！一鮮素的鐵板素排飯跟砂鍋臭豆腐煲香氣太犯規啦！';
      break;
    }

    case 'youmama': {
      // 單車圈 #3 游媽媽素食小吃：親切古早味店鋪 + 竹蒸籠素油飯 & 飽滿元寶水餃盤
      const b = createShopBuilding({
        wallColor: '#fbf2e2',
        roofColor: '#df7a26',
        trimColor: '#7d4d26',
        awningA: '#df7a26',
        awningB: '#fff9ed',
        signText: '游媽媽素食',
        signBg,
        rotY: subtleYaw
      });
      group.add(b);

      // 雙層傳統竹蒸籠 + 油亮古早味素油飯
      const steamer = new THREE.Group();
      steamer.position.set(-0.24, 0.47, 0);
      steamer.add(makeCyl(0.26, 0.26, 0.13, '#d6ad72', { seg: 16, pos: [0, 0.065, 0] }));
      steamer.add(makeCyl(0.265, 0.265, 0.13, '#c79b5e', { seg: 16, pos: [0, 0.2, 0] }));
      steamer.add(makeSphere(0.23, '#9e5e2e', { seg: 12, scale: [1, 0.42, 1], pos: [0, 0.26, 0] }));
      steamer.add(makeBox([0.12, 0.03, 0.04], '#4a2e1b', { pos: [0.05, 0.31, 0.04] }));
      steamer.add(makeSphere(0.035, '#52a349', { pos: [-0.05, 0.31, -0.03] }));
      dishPedestal.add(steamer);
      dishPedestal.add(createRisingSteam([-0.24, 0.82, 0], 4.4, registerAnim));

      // 白瓷盤裝 5 顆飽滿招牌元寶水餃
      dishPedestal.add(makeCyl(0.24, 0.2, 0.035, '#ffffff', { seg: 14, pos: [0.3, 0.49, 0.03] }));
      for (let d = 0; d < 5; d++) {
        const a = (d / 5) * Math.PI * 2;
        dishPedestal.add(
          makeSphere(0.068, '#fff7e6', {
            seg: 10,
            scale: [1.3, 0.78, 0.75],
            pos: [0.3 + Math.cos(a) * 0.1, 0.53, 0.03 + Math.sin(a) * 0.1],
            rot: [0, a, 0]
          })
        );
      }

      group.add(createPatioSet({ pos: [-1.1, 0.04, 1.15], tableColor: '#c9533b' }));
      critterKind = 'panda';
      critterSpeech = '馬偕對面的游媽媽下午不休息！古早味素油飯跟水餃銅板價超佛心！';
      break;
    }

    case 'caigenxiang': {
      // 單車圈 #4 菜根香素食：十八尖山腳快炒店 + 中華鐵鍋金黃炒飯 & 門口停放橘色小機車
      const b = createShopBuilding({
        wallColor: '#f7efe2',
        roofColor: '#c95f2e',
        trimColor: '#753e22',
        awningA: '#c95f2e',
        awningB: '#fff7eb',
        signText: '菜根香素食',
        signBg,
        rotY: subtleYaw
      });
      group.add(b);

      // 店門口停放一台呼應備註「機車 10 分鐘內可達」與 VEG_MAP.jpg 的橘色微縮機車
      const parkedScooter = new THREE.Group();
      parkedScooter.position.set(-1.32, 0.04, 1.15);
      parkedScooter.rotation.y = 0.65;
      parkedScooter.add(makeTorus(0.12, 0.04, '#2b2f33', { pos: [0, 0.14, 0.24], rot: [0, Math.PI / 2, 0] }));
      parkedScooter.add(makeTorus(0.12, 0.04, '#2b2f33', { pos: [0, 0.14, -0.24], rot: [0, Math.PI / 2, 0] }));
      parkedScooter.add(makeBox([0.2, 0.19, 0.52], '#ea7a2e', { r: 0.05, pos: [0, 0.24, 0] }));
      parkedScooter.add(makeBox([0.18, 0.3, 0.1], '#ea7a2e', { r: 0.03, pos: [0, 0.38, 0.2], rot: [-0.2, 0, 0] }));
      parkedScooter.add(makeBox([0.32, 0.035, 0.035], '#4a555c', { pos: [0, 0.54, 0.17] }));
      group.add(parkedScooter);

      // 中華單柄黑鐵炒鍋 + 粒粒分明金黃招牌炒飯
      const wok = new THREE.Group();
      wok.position.set(-0.2, 0.48, 0.02);
      wok.add(makeSphere(0.28, '#282a2d', { seg: 14, thetaStart: Math.PI * 0.5, thetaLength: Math.PI * 0.5, pos: [0, 0.28, 0] }));
      wok.add(makeCyl(0.025, 0.025, 0.26, '#6e472b', { seg: 6, pos: [-0.34, 0.26, 0], rot: [0, 0, Math.PI / 2.3] }));
      wok.add(makeSphere(0.23, '#f0c24d', { seg: 12, scale: [1, 0.52, 1], pos: [0, 0.22, 0] }));
      wok.add(makeSphere(0.032, '#4ba346', { pos: [0.06, 0.32, 0.05] }));
      wok.add(makeSphere(0.032, '#e35d2b', { pos: [-0.07, 0.31, -0.04] }));
      dishPedestal.add(wok);

      // 手工素水餃盤
      dishPedestal.add(makeCyl(0.2, 0.17, 0.03, '#ffffff', { seg: 12, pos: [0.32, 0.49, 0.02] }));
      dishPedestal.add(makeSphere(0.065, '#fff8e8', { scale: [1.3, 0.75, 0.75], pos: [0.27, 0.53, 0.02] }));
      dishPedestal.add(makeSphere(0.065, '#fff8e8', { scale: [1.3, 0.75, 0.75], pos: [0.37, 0.53, 0.05] }));

      critterKind = 'squirrel';
      critterSpeech = '學府路菜根香大火快炒的招牌炒飯與沙茶燴麵，全素超夠味！';
      break;
    }

    case 'suyiyuan':
    default: {
      // 單車圈 #5 素怡園（交大二餐 2 樓）：明亮雙層自助餐廳 + 紫米十穀飯木桶 & 四格自助餐檯
      const b = createShopBuilding({
        w: 2.65,
        h: 1.45,
        d: 1.75,
        wallColor: '#f2f5f2',
        roofColor: '#d97224',
        roofStyle: 'pavilion',
        trimColor: '#3d6b66',
        awningA: '#d97224',
        awningB: '#ffffff',
        signText: '素怡園',
        signBg,
        rotY: subtleYaw
      });
      group.add(b);

      // 四格秤重素食自助餐盤 + 紫米十穀飯木桶
      dishPedestal.add(makeBox([0.62, 0.08, 0.48], '#dce3e6', { r: 0.02, pos: [-0.18, 0.51, 0] }));
      const trayFoods = [
        [-0.31, 0.11, '#c95b2b'], // 家常紅燒豆腐
        [-0.05, 0.11, '#4da34b'], // 季節時蔬
        [-0.31, -0.11, '#f0b63a'], // 金瓜料理
        [-0.05, -0.11, '#7a5238']  // 香菇滷味
      ];
      for (const [fx, fz, col] of trayFoods) {
        dishPedestal.add(makeBox([0.22, 0.055, 0.17], col, { r: 0.015, pos: [fx, 0.56, fz] }));
      }

      // 十穀飯木桶
      dishPedestal.add(makeCyl(0.18, 0.16, 0.22, '#b8804a', { seg: 12, pos: [0.34, 0.58, 0] }));
      dishPedestal.add(makeSphere(0.16, '#693b5e', { seg: 10, scale: [1, 0.45, 1], pos: [0.34, 0.69, 0] }));

      group.add(createPatioSet({ pos: [-1.15, 0.04, 1.18], umbrellaColor: '#4a8584' }));
      critterKind = 'panda';
      critterSpeech = '穿過清交小徑就到交大二餐素怡園！紫米十穀飯配滿滿好菜任你夾！';
      break;
    }
  }

  // 每座餐廳浮島配置一位動態饕客或主廚小人 + 一隻可點擊對話尋寶彩蛋（松鼠 / 清華胖達）
  group.add(
    createMiniPerson({
      shirt: island.ring === 'inner' ? '#ffffff' : '#ffe6c7',
      pants: '#2f3e56',
      hat: island.index % 3 === 0 ? 'chef' : null,
      holding: island.id === 'amushi' ? 'cup' : 'bowl',
      seed: island.index + 10,
      route: [
        [-0.45, 0.04, 0.95],
        [0.42, 0.04, 1.55]
      ],
      speed: 0.34,
      registerAnim
    })
  );

  group.add(
    createInteractiveCritter({
      id: `critter-${island.id}`,
      kind: critterKind,
      speech: critterSpeech,
      pos: critterKind === 'panda' ? [2.18, 0.04, 1.48] : [1.95, 0.04, 0.45],
      rotY: critterKind === 'panda' ? -0.32 : -0.5,
      registerAnim,
      registerCritter
    })
  );
}

// ============================================================================
// 3. 天空之城全場動態點綴：雲橋單車/機車騎士、青花菜熱氣球、胡蘿蔔飛船與飛鳥
// ============================================================================

function createBroccoliAirBalloon(registerAnim) {
  const root = new THREE.Group();
  root.userData.dyn = true;

  // 巨型翠綠青花菜球囊（致敬 VEG_MAP.jpg 插畫綠樹/青花菜元素）
  root.add(makeCyl(0.55, 0.35, 0.85, '#8bc462', { seg: 10, pos: [0, 1.35, 0] }));
  const florets = [
    [0, 2.35, 0, 1.25, '#3e8c4c'],
    [0.85, 2.05, 0.3, 0.85, '#4da358'],
    [-0.82, 2.08, -0.25, 0.88, '#387d44'],
    [0.25, 2.1, -0.82, 0.82, '#479951'],
    [-0.28, 2.0, 0.82, 0.8, '#55ad5e']
  ];
  for (const [fx, fy, fz, fr, col] of florets) {
    root.add(makeIco(fr, col, { detail: 1, pos: [fx, fy, fz] }));
  }

  // 吊索與藤編吊籃
  for (const [rx, rz] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) {
    root.add(makeCyl(0.015, 0.015, 0.72, '#8c6a4a', { seg: 5, pos: [rx, 0.62, rz] }));
  }
  root.add(makeBox([0.62, 0.44, 0.62], '#c78d4e', { r: 0.06, pos: [0, 0.22, 0] }));
  root.add(makeSphere(0.11, '#fbe8a8', { material: glowWindowMat, pos: [0, 0.72, 0], castShadow: false }));

  if (registerAnim) {
    registerAnim(elapsed => {
      const a = elapsed * 0.055 + 0.8;
      root.position.set(Math.cos(a) * 19.8, 10.2 + Math.sin(elapsed * 0.9) * 0.55, Math.sin(a) * 19.8);
      root.rotation.y = -a + Math.PI / 2;
    });
  }
  return root;
}

function createCarrotSkyship(registerAnim) {
  const root = new THREE.Group();
  root.userData.dyn = true;

  // 胡蘿蔔造型飛船船身（致敬 VEG_MAP.jpg 外環胡蘿蔔橘主題）
  root.add(makeCone(0.72, 3.1, '#ea7a2e', { seg: 12, pos: [0, 0.9, 0], rot: [Math.PI / 2, 0, 0] }));
  root.add(makeSphere(0.71, '#f08a3e', { seg: 12, pos: [0, 0.9, 1.52] }));
  // 尾部翠綠胡蘿蔔葉尾翼
  for (const rotZ of [0, Math.PI / 3, -Math.PI / 3]) {
    root.add(makeBox([0.12, 0.95, 0.52], '#4e9e47', { r: 0.04, pos: [0, 0.9, -1.78], rot: [0.25, 0, rotZ] }));
  }
  // 下方木質吊艙與夜間發光舷窗
  root.add(makeBox([0.56, 0.38, 1.15], '#fff5e4', { r: 0.08, pos: [0, 0.08, 0.15] }));
  root.add(makeBox([0.6, 0.16, 0.72], '#fbe8a8', { material: glowWindowMat, pos: [0, 0.12, 0.15], castShadow: false }));

  if (registerAnim) {
    registerAnim(elapsed => {
      const a = -elapsed * 0.048 + 3.4;
      root.position.set(Math.cos(a) * 28.5, 12.4 + Math.cos(elapsed * 0.8) * 0.48, Math.sin(a) * 28.5);
      root.rotation.y = -a - Math.PI / 2;
    });
  }
  return root;
}

function createSkyBird(seed, registerAnim) {
  const root = new THREE.Group();
  root.userData.dyn = true;

  const wingL = new THREE.Group();
  wingL.add(makeBox([0.32, 0.03, 0.12], '#ffffff', { r: 0.01, pos: [-0.16, 0, 0], castShadow: false }));
  const wingR = new THREE.Group();
  wingR.add(makeBox([0.32, 0.03, 0.12], '#ffffff', { r: 0.01, pos: [0.16, 0, 0], castShadow: false }));
  root.add(wingL, wingR);

  if (registerAnim) {
    registerAnim(elapsed => {
      const flap = Math.sin(elapsed * 7.5 + seed * 2) * 0.52;
      wingL.rotation.z = -flap;
      wingR.rotation.z = flap;
      const a = elapsed * (0.09 + (seed % 3) * 0.015) + seed * 1.4;
      const r = 12 + (seed % 4) * 4.5;
      root.position.set(Math.cos(a) * r, 7.8 + (seed % 3) * 1.3 + Math.sin(elapsed * 1.4 + seed) * 0.35, Math.sin(a) * r);
      root.rotation.y = -a;
    });
  }
  return root;
}

// ============================================================================
// 3. 黃色肌肉奶蛙（Swole Yellow Milk Frog）V2 零穿模自然肩寬雙手貼肚純幾何建模
// ============================================================================

// Parallel-Transport (Bishop Frame) 零扭轉連續平滑變徑圓管 + 兩端半球封口（零斷頭折線穿模）
function makeSmoothVariableTube(controlNodes, material, tubularSegs = 48, radialSegs = 22) {
  const pts = controlNodes.map(n => new THREE.Vector3(...n.p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.45);

  const radiusAt = (t) => {
    const scaled = t * (controlNodes.length - 1);
    const i0 = Math.min(controlNodes.length - 2, Math.max(0, Math.floor(scaled)));
    const f = scaled - i0;
    const s = f * f * (3 - 2 * f);
    return controlNodes[i0].r * (1 - s) + controlNodes[i0 + 1].r * s;
  };

  const tangents = [];
  const normals = [];
  const binormals = [];

  for (let i = 0; i <= tubularSegs; i++) {
    tangents.push(curve.getTangentAt(i / tubularSegs).normalize());
  }

  let ref = new THREE.Vector3(0, 0, 1);
  if (Math.abs(tangents[0].dot(ref)) > 0.85) ref.set(0, 1, 0);
  let nPrev = ref.clone().addScaledVector(tangents[0], -ref.dot(tangents[0])).normalize();
  normals.push(nPrev.clone());
  binormals.push(new THREE.Vector3().crossVectors(tangents[0], nPrev).normalize());

  for (let i = 1; i <= tubularSegs; i++) {
    const tPrev = tangents[i - 1];
    const tCurr = tangents[i];
    const axis = new THREE.Vector3().crossVectors(tPrev, tCurr);
    if (axis.lengthSq() > 1e-10) {
      axis.normalize();
      const angle = Math.acos(Math.min(1, Math.max(-1, tPrev.dot(tCurr))));
      nPrev = nPrev.clone().applyAxisAngle(axis, angle);
    }
    nPrev.addScaledVector(tCurr, -nPrev.dot(tCurr)).normalize();
    normals.push(nPrev.clone());
    binormals.push(new THREE.Vector3().crossVectors(tCurr, nPrev).normalize());
  }

  const capRings = 5;
  const rings = [];

  // 起點半球端蓋
  {
    const c0 = curve.getPointAt(0);
    const r0 = radiusAt(0);
    const T0 = tangents[0];
    const N0 = normals[0];
    const B0 = binormals[0];
    for (let c = capRings; c >= 1; c--) {
      const phi = (c / capRings) * (Math.PI / 2);
      const center = c0.clone().addScaledVector(T0, -Math.sin(phi) * r0);
      const ringR = Math.max(0.0004, Math.cos(phi) * r0);
      rings.push({ center, N: N0, B: B0, r: ringR });
    }
  }

  // 主管身
  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    rings.push({
      center: curve.getPointAt(t),
      N: normals[i],
      B: binormals[i],
      r: radiusAt(t)
    });
  }

  // 終點半球端蓋
  {
    const c1 = curve.getPointAt(1);
    const r1 = radiusAt(1);
    const T1 = tangents[tubularSegs];
    const N1 = normals[tubularSegs];
    const B1 = binormals[tubularSegs];
    for (let c = 1; c <= capRings; c++) {
      const phi = (c / capRings) * (Math.PI / 2);
      const center = c1.clone().addScaledVector(T1, Math.sin(phi) * r1);
      const ringR = Math.max(0.0004, Math.cos(phi) * r1);
      rings.push({ center, N: N1, B: B1, r: ringR });
    }
  }

  const positions = [];
  const indices = [];

  for (let i = 0; i < rings.length; i++) {
    const { center, N, B, r } = rings[i];
    for (let j = 0; j <= radialSegs; j++) {
      const theta = (j / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      positions.push(
        center.x + r * (cos * N.x + sin * B.x),
        center.y + r * (cos * N.y + sin * B.y),
        center.z + r * (cos * N.z + sin * B.z)
      );
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createYellowBuffFrog({ dataset, registerAnim, registerCritter }) {
  const container = new THREE.Group();
  container.name = 'buff-frog-container';

  const root = new THREE.Group();
  root.name = 'buff-frog-root';
  root.userData.dyn = true;
  container.add(root);

  // 蛙身微縮玩偶尺寸
  const frogModel = new THREE.Group();
  frogModel.scale.set(0.68, 0.68, 0.68);
  root.add(frogModel);

  const matYellow = mat('#fab81c');
  const matBelly  = mat('#fce3d2');
  const matDigit  = mat('#bf8d50');
  const matEyeG   = mat('#88d682', { roughness: 0.46 });
  const matEyeB   = mat('#16181a', { roughness: 0.22 });
  const matWhite  = mat('#ffffff', { roughness: 0.12, emissive: '#ffffff', emissiveIntensity: 0.2 });
  const matMouth  = mat('#8c5d1c', { roughness: 0.65 });

  // 1. 一體成形絲滑梨形軀幹（Lathe 樣條旋轉曲面，頭身腹流線一體零接縫）
  const profileCtrl = [
    new THREE.Vector2(0.001, 0.13),  // 胯底
    new THREE.Vector2(0.24,  0.16),  // 下腹底緣
    new THREE.Vector2(0.415, 0.30),  // 下腹飽滿圓弧
    new THREE.Vector2(0.472, 0.50),  // 圓滾滾最大肚圍
    new THREE.Vector2(0.452, 0.70),  // 中腹過渡
    new THREE.Vector2(0.408, 0.88),  // 胸腔上緣
    new THREE.Vector2(0.335, 1.05),  // 柔和無脖流線收窄
    new THREE.Vector2(0.315, 1.21),  // 呆萌圓潤臉頰
    new THREE.Vector2(0.272, 1.35),  // 額頭眼窩區
    new THREE.Vector2(0.175, 1.455), // 圓拱頭頂斜坡
    new THREE.Vector2(0.075, 1.500), // 頭頂圓弧
    new THREE.Vector2(0.001, 1.510)  // 頭頂極點閉合
  ];
  const lathePts = new THREE.SplineCurve(profileCtrl).getPoints(64);
  const bodyScaleX = 1.05;
  const bodyScaleZ = 0.93;
  const bodyGeo = new THREE.LatheGeometry(lathePts, 48);
  const bodyMesh = new THREE.Mesh(bodyGeo, matYellow);
  bodyMesh.scale.set(bodyScaleX, 1.0, bodyScaleZ);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  frogModel.add(bodyMesh);

  function bodyRadiusAtY(y) {
    let best = lathePts[0].x;
    let minDiff = Infinity;
    for (const p of lathePts) {
      const d = Math.abs(p.y - y);
      if (d < minDiff) {
        minDiff = d;
        best = p.x;
      }
    }
    return best;
  }

  // 2. 大面積粉嫩蜜桃圓肚皮（自然貼合於肚子前方，正面飽滿圓潤）
  const bellyAx = 0.418;
  const bellyAy = 0.435;
  const bellyAz = 0.395;
  const bellyCy = 0.555;
  const bellyCz = 0.068;

  const bellyGeo = getCachedGeo('sp_belly_patch_48', () => new THREE.SphereGeometry(1.0, 48, 36));
  const bellyMesh = new THREE.Mesh(bellyGeo, matBelly);
  bellyMesh.scale.set(bellyAx, bellyAy, bellyAz);
  bellyMesh.position.set(0, bellyCy, bellyCz);
  bellyMesh.castShadow = true;
  bellyMesh.receiveShadow = true;
  frogModel.add(bellyMesh);

  function frontSurfaceZ(x, y) {
    let zP = -1;
    const tP = 1 - (x / bellyAx) ** 2 - ((y - bellyCy) / bellyAy) ** 2;
    if (tP > 0) zP = bellyCz + bellyAz * Math.sqrt(tP);

    let zB = -1;
    const rY = bodyRadiusAtY(y);
    const rx = rY * bodyScaleX;
    const rz = rY * bodyScaleZ;
    const tB = 1 - (x / rx) ** 2;
    if (tB > 0) zB = rz * Math.sqrt(tB);

    return Math.max(zP, zB);
  }

  // 3. 適中圓潤肩膀 ＋ 零扭轉圓手臂 ＋ 雙手自然貼放粉嫩圓肚（零穿模）
  for (const s of [-1, 1]) {
    const wx = s * 0.255;
    const wy = 0.515;
    const rWrist = 0.072;
    const wz = frontSurfaceZ(wx, wy) + rWrist * 0.82;

    const px = s * 0.205;
    const py = 0.498;
    const rPalm = 0.064;
    const pz = frontSurfaceZ(px, py) + rPalm * 0.65;

    // 零扭轉平滑圓管手臂：斜方肌根部 -> 自然圓肩 -> 圓潤上臂 -> 微屈手肘繞過肚側 -> 手腕
    const armNodes = [
      { p: [s * 0.22,  0.93, -0.01 ], r: 0.122 },
      { p: [s * 0.425, 0.855, 0.015], r: 0.138 },
      { p: [s * 0.505, 0.72,  0.10 ], r: 0.116 },
      { p: [s * 0.515, 0.59,  0.235], r: 0.098 },
      { p: [s * 0.400, 0.54,  0.375], r: 0.086 },
      { p: [wx,        wy,    wz   ], r: rWrist },
      { p: [px,        py,    pz   ], r: rPalm }
    ];
    frogModel.add(makeSmoothVariableTube(armNodes, matYellow, 48, 22));

    // 黃色手掌平滑包覆墊
    const palmGeo = getCachedGeo('sp_palm_mat_20', () => new THREE.SphereGeometry(0.068, 20, 16));
    const palmMesh = new THREE.Mesh(palmGeo, matYellow);
    palmMesh.scale.set(1.12, 0.96, 0.58);
    palmMesh.position.set(s * 0.198, py, frontSurfaceZ(s * 0.198, py) + 0.036);
    palmMesh.rotation.set(0.08, -s * 0.44, -s * 0.15);
    palmMesh.castShadow = true;
    palmMesh.receiveShadow = true;
    frogModel.add(palmMesh);

    // 4 根圓潤奶褐色小手指貼於粉嫩圓肚弧面
    const fingerSpecs = [
      { dy:  0.034, startX: 0.186, lenX: 0.072, dyTip:  0.005, r: 0.0195 },
      { dy:  0.011, startX: 0.184, lenX: 0.082, dyTip: -0.003, r: 0.0205 },
      { dy: -0.012, startX: 0.186, lenX: 0.075, dyTip: -0.009, r: 0.0195 },
      { dy: -0.033, startX: 0.192, lenX: 0.056, dyTip: -0.014, r: 0.0170 }
    ];
    for (const fg of fingerSpecs) {
      const fx1 = s * fg.startX;
      const fy1 = py + fg.dy;
      const fz1 = frontSurfaceZ(fx1, fy1) + fg.r * 0.82;

      const fxMid = s * (fg.startX - fg.lenX * 0.5);
      const fyMid = fy1 + fg.dyTip * 0.5;
      const fzMid = frontSurfaceZ(fxMid, fyMid) + fg.r * 0.82;

      const fx2 = s * (fg.startX - fg.lenX);
      const fy2 = fy1 + fg.dyTip;
      const fz2 = frontSurfaceZ(fx2, fy2) + fg.r * 0.76;

      frogModel.add(
        makeSmoothVariableTube(
          [
            { p: [fx1,   fy1,   fz1  ], r: fg.r },
            { p: [fxMid, fyMid, fzMid], r: fg.r * 0.94 },
            { p: [fx2,   fy2,   fz2  ], r: fg.r * 0.82 }
          ],
          matDigit,
          12,
          14
        )
      );
    }
  }

  // 4. 呆萌大綠眼、深黑圓瞳、眼神高光與微笑弧線
  for (const s of [-1, 1]) {
    const ex = s * 0.146;
    const ey = 1.335;
    const ez = frontSurfaceZ(ex, ey) - 0.014;

    const eyeGeo = getCachedGeo('sp_eye_green_22', () => new THREE.SphereGeometry(0.082, 22, 16));
    const eyeMesh = new THREE.Mesh(eyeGeo, matEyeG);
    eyeMesh.scale.set(1.0, 1.06, 0.68);
    eyeMesh.position.set(ex, ey, ez);
    eyeMesh.rotation.set(-0.14, s * 0.24, 0);
    frogModel.add(eyeMesh);

    const pupilGeo = getCachedGeo('sp_eye_pupil_18', () => new THREE.SphereGeometry(0.048, 18, 14));
    const pupilMesh = new THREE.Mesh(pupilGeo, matEyeB);
    pupilMesh.scale.set(1.0, 1.06, 0.55);
    pupilMesh.position.set(ex + s * 0.005, ey + 0.002, ez + 0.036);
    pupilMesh.rotation.set(-0.14, s * 0.24, 0);
    frogModel.add(pupilMesh);

    const specGeo = getCachedGeo('sp_eye_spec_10', () => new THREE.SphereGeometry(0.015, 10, 8));
    const specMesh = new THREE.Mesh(specGeo, matWhite);
    specMesh.scale.set(1, 1, 0.7);
    specMesh.position.set(ex + s * 0.005 + 0.016, ey + 0.022, ez + 0.058);
    specMesh.castShadow = false;
    frogModel.add(specMesh);
  }

  // 微笑嘴角弧線
  const smileNodes = [];
  for (let i = 0; i <= 8; i++) {
    const u = (i / 8) * 2 - 1;
    const mx = u * 0.086;
    const my = 1.215 + (u * u) * 0.020;
    const mz = frontSurfaceZ(mx, my) + 0.004;
    smileNodes.push({ p: [mx, my, mz], r: 0.0082 });
  }
  frogModel.add(makeSmoothVariableTube(smileNodes, matMouth, 20, 10));

  // 5. 渾圓結實雙腿與三趾青蛙腳掌
  for (const s of [-1, 1]) {
    const legNodes = [
      { p: [s * 0.23,  0.32,  0.01 ], r: 0.168 },
      { p: [s * 0.305, 0.18,  0.04 ], r: 0.128 },
      { p: [s * 0.315, 0.065, 0.025], r: 0.088 },
      { p: [s * 0.32,  0.035, 0.095], r: 0.072 }
    ];
    frogModel.add(makeSmoothVariableTube(legNodes, matYellow, 26, 20));

    const footGeo = getCachedGeo('sp_foot_base_20', () => new THREE.SphereGeometry(0.094, 20, 14));
    const footMesh = new THREE.Mesh(footGeo, matYellow);
    footMesh.scale.set(1.14, 0.42, 1.25);
    footMesh.position.set(s * 0.32, 0.035, 0.088);
    footMesh.rotation.set(0, s * 0.12, 0);
    footMesh.castShadow = true;
    footMesh.receiveShadow = true;
    frogModel.add(footMesh);

    [-0.060, 0, 0.060].forEach((dx, idx) => {
      const zToe = 0.188 + (idx === 1 ? 0.022 : 0);
      frogModel.add(
        makeSmoothVariableTube(
          [
            { p: [s * 0.32 + dx * 0.78, 0.032, 0.132], r: 0.038 },
            { p: [s * 0.32 + dx,        0.026, zToe ], r: 0.035 }
          ],
          matDigit,
          10,
          14
        )
      );
    });
  }

  // 6. 11 站「浮島導覽」巡航航點與島間空中「落腳小雲朵」動態建構
  const allIslands = dataset.allIslands || [dataset.hub, ...dataset.shops];

  function getIslandLanding(isl) {
    if (isl.isHub) {
      return new THREE.Vector3(0.85, 0.05, 2.35); // 主島廣場南側開闊草坪
    }
    // 避開中央建築 [0, 0] 與右側料理台 [1.12, 1.18]，落在店前迎賓庭院草坪開闊處
    return new THREE.Vector3(isl.x - 0.65, isl.baseY + 0.05, isl.z + 1.25);
  }

  // 依照 11 站導覽順序計算各島著地點與島間空中中繼航點
  const waypoints = [];
  const cloudletPositions = [];

  for (let i = 0; i < allIslands.length; i++) {
    const islA = allIslands[i];
    const islB = allIslands[(i + 1) % allIslands.length];
    const pA = getIslandLanding(islA);
    const pB = getIslandLanding(islB);

    // 1. 本島著地點（高度嚴格對齊該島草地地面）
    waypoints.push(pA);

    // 2. 島間空中跳躍中繼點（垂直高度確保遠高於兩側浮島地面，踩雲飛躍）
    let midX = (pA.x + pB.x) * 0.5;
    let midZ = (pA.z + pB.z) * 0.5;

    // 外環或大跨距航段沿弧線外側微擴，使航線更加優美
    if (islA.ring === 'outer' || islB.ring === 'outer') {
      const midDist = Math.hypot(midX, midZ);
      if (midDist > 0.001) {
        const targetR = Math.max(midDist, 25.5);
        midX = (midX / midDist) * targetR;
        midZ = (midZ / midDist) * targetR;
      }
    } else if (!islA.isHub && !islB.isHub) {
      const midDist = Math.hypot(midX, midZ);
      if (midDist > 0.001) {
        const targetR = Math.max(midDist, 14.5);
        midX = (midX / midDist) * targetR;
        midZ = (midZ / midDist) * targetR;
      }
    }

    const midY = Math.max(pA.y, pB.y) + 1.35;
    const midPoint = new THREE.Vector3(midX, midY, midZ);
    waypoints.push(midPoint);
    cloudletPositions.push(midPoint);
  }

  // 在每個島間空中中繼點正下方拼裝一朵小巧精緻的低多邊形白雲（落腳小雲朵）
  const cloudMat = mat('#ffffff', {
    roughness: 0.92,
    transparent: true,
    opacity: 0.92,
    flatShading: true
  });

  const cloudletsGroup = new THREE.Group();
  cloudletsGroup.name = 'buff-frog-stepping-cloudlets';
  container.add(cloudletsGroup);

  cloudletPositions.forEach(pos => {
    const cloudGroup = new THREE.Group();
    cloudGroup.position.set(pos.x, pos.y - 0.22, pos.z);

    const puffs = [
      { p: [ 0.00,  0.00,  0.00], r: 0.52, s: [1.25, 0.65, 1.15] },
      { p: [ 0.36, -0.04,  0.12], r: 0.38, s: [1.10, 0.60, 1.05] },
      { p: [-0.34, -0.05, -0.10], r: 0.36, s: [1.10, 0.58, 1.05] },
      { p: [ 0.06,  0.08, -0.22], r: 0.34, s: [1.15, 0.55, 1.10] }
    ];

    for (const pf of puffs) {
      cloudGroup.add(
        makeIco(pf.r, '#ffffff', {
          detail: 1,
          material: cloudMat,
          pos: pf.p,
          scale: pf.s,
          castShadow: true,
          receiveShadow: true
        })
      );
    }
    cloudletsGroup.add(cloudGroup);
  });

  let currentWpIndex = 0;
  let moveProgress = 0; // 0 ~ 1 在兩個節點間移動
  let flexTimer = 0; // 點擊時彈性縮放計時器

  const flexQuotes = [
    '呱！摸摸這顆圓滾滾的黃金大肚肚，裡面都是滿滿的高纖植物蛋白！💪🥦',
    '75秒紅綠燈算什麼？正好讓本蛙摸摸肚子原地深蹲75下啦呱！⏱️🐸',
    '誰說吃素沒力氣？來跟本蛙比腕力啊呱！🔥',
    '巡邏群島中！今天各島嶼的蔬食高纖營養全數驗收合格！✨',
    '深蹲、推胸、喝安姆士無糖豆漿，呱！這就是猛蛙之道！'
  ];

  if (registerAnim) {
    registerAnim((elapsed, delta = 0.016) => {
      // 點擊激動彈性縮放特寫動畫
      if (flexTimer > 0) {
        flexTimer -= delta;
        const bounce = Math.sin(flexTimer * 16) * 0.07;
        frogModel.position.y = 0.18 + Math.max(0, Math.sin(flexTimer * 12) * 0.32);
        frogModel.scale.set(0.68 + bounce, 0.68 - bounce * 0.8, 0.68 + bounce);
        return;
      } else {
        frogModel.scale.set(0.68, 0.68, 0.68);
      }

      // 常態跨島巡邏航行
      const p1 = waypoints[currentWpIndex];
      const p2 = waypoints[(currentWpIndex + 1) % waypoints.length];
      const dist = p1.distanceTo(p2);
      const hopSpeed = 1.45 / Math.max(2, dist);

      moveProgress += delta * hopSpeed;
      if (moveProgress >= 1) {
        moveProgress = 0;
        currentWpIndex = (currentWpIndex + 1) % waypoints.length;
      }

      root.position.lerpVectors(p1, p2, moveProgress);

      // 動態地面高度防穿模守衛（Elevation Guard）：
      // 若奶蛙水平位於任一浮島半徑內，垂直高度嚴格禁止低於該島草皮地面 (baseY + 0.05)
      for (const isl of allIslands) {
        const dSq = (root.position.x - isl.x) ** 2 + (root.position.z - isl.z) ** 2;
        const safeR = (isl.islandRadius || 3.8) * 0.95;
        if (dSq < safeR * safeR) {
          const minSafeY = isl.baseY + 0.05;
          if (root.position.y < minSafeY) {
            root.position.y = minSafeY;
          }
          break;
        }
      }

      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      if (dir.lengthSq() > 0.001) {
        const targetRotY = Math.atan2(dir.x, dir.z);
        root.rotation.y += (targetRotY - root.rotation.y) * 0.12;
      }

      // 拋物線肌肉蛙跳（在安全地面/雲層高度之上疊加跳躍拋物線）
      const hopsPerLeg = Math.max(2, Math.round(dist / 3.2));
      const hopPhase = (moveProgress * hopsPerLeg) % 1;
      const hopY = Math.sin(hopPhase * Math.PI) * 0.75;
      frogModel.position.y = Math.max(0, hopY);

      // 落地緩衝擠壓 (Squash & Stretch)
      if (hopPhase < 0.15 || hopPhase > 0.85) {
        frogModel.scale.set(0.73, 0.61, 0.73);
      } else {
        frogModel.scale.set(0.65, 0.74, 0.65);
      }
    });
  }

  // 7. 註冊為可點擊彩蛋角色
  if (registerCritter) {
    const hitGeo = getCachedGeo('sphere_hit_buff_frog_0.8', () => new THREE.SphereGeometry(0.8, 8, 8));
    const hitMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
    const hitSphere = new THREE.Mesh(hitGeo, hitMat);
    hitSphere.position.set(0, 0.65, 0);
    root.add(hitSphere);

    registerCritter(hitSphere, {
      id: 'critter-buff-frog',
      kind: 'buff_frog',
      speech: flexQuotes[0],
      getSpeech() {
        return flexQuotes[Math.floor(Math.random() * flexQuotes.length)];
      },
      onHop() {
        flexTimer = 1.35;
      }
    });
  }

  return container;
}

export function buildSkyDecorScene(group, { dataset, registerAnim, registerCritter }) {
  // 1. 雲朵單車航道上的紅色腳踏車與橘色小機車騎士
  const bikeTargets = ['mansuyuan', 'yixiansu', 'youmama', 'suyiyuan'];
  bikeTargets.forEach((id, idx) => {
    const shop = dataset.byId[id];
    if (shop) {
      group.add(createBridgeCyclist({ hub: dataset.hub, shop, kind: 'bike', seed: idx + 1, registerAnim }));
    }
  });

  const scooterShop = dataset.byId['caigenxiang'];
  if (scooterShop) {
    group.add(createBridgeCyclist({ hub: dataset.hub, shop: scooterShop, kind: 'scooter', seed: 6, registerAnim }));
  }

  // 2. 天空之城主題飛行器：青花菜熱氣球、胡蘿蔔飛船與 5 隻展翅白鳥
  group.add(createBroccoliAirBalloon(registerAnim));
  group.add(createCarrotSkyship(registerAnim));
  for (let i = 0; i < 5; i++) {
    group.add(createSkyBird(i + 1, registerAnim));
  }

  // 3. 在群島各島嶼間移動的「黃色肌肉奶蛙」特別彩蛋角色！
  group.add(createYellowBuffFrog({ dataset, registerAnim, registerCritter }));
}
