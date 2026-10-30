// 2026 清大福青社蔬食地圖 — 中央清華主島、「簡冊立柱」校門地標與共用微縮植被/角色/彩蛋積木庫
// 100% 純程式碼基本幾何拼裝（零外部 GLTF/FBX 模型），靜態零件自動納入同材質 mergeGeometries。

import * as THREE from 'three';
import {
  getCachedGeo,
  mat,
  glowWindowMat,
  lakeWaterMat,
  makeBox,
  makeCyl,
  makeSphere,
  makeCone,
  makeIco,
  makeTorus,
  makeGableRoof,
  makeSignBoard
} from './island-world.js';

// ============================================================================
// 1. 清華大學校門「簡冊立柱」精準 3D 積木建模 (依據 3 張實景附圖還原)
// ============================================================================
let nthuCalligraphyMat = null;

function getNthuInscriptionMaterial() {
  if (nthuCalligraphyMat) return nthuCalligraphyMat;

  const w = 256;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const draw = () => {
    const ctx = canvas.getContext('2d');
    // 與簡冊立柱本體一致之暖象牙白石材底色
    ctx.fillStyle = '#f0ede3';
    ctx.fillRect(0, 0, w, h);

    // 極細微石材水平分縫紋理
    ctx.strokeStyle = 'rgba(160, 152, 136, 0.18)';
    ctx.lineWidth = 2;
    for (let y = 96; y < h; y += 96) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 直排六字「國立清華大學」立體深墨書法字（帶微陰影表現浮雕銅字立體感）
    const chars = ['國', '立', '清', '華', '大', '學'];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 86px "Noto Serif TC", "DFKai-SB", "BiauKai", "PMingLiU", "Microsoft JhengHei", serif';

    const startY = 104;
    const stepY = 112;
    chars.forEach((ch, idx) => {
      const cy = startY + idx * stepY;
      ctx.fillStyle = 'rgba(40, 38, 34, 0.24)';
      ctx.fillText(ch, w / 2 + 4, cy + 5);
      ctx.fillStyle = '#1b1d1c';
      ctx.fillText(ch, w / 2, cy);
    });
    tex.needsUpdate = true;
  };

  draw();
  document.fonts?.ready?.then(draw, () => {});

  nthuCalligraphyMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.72,
    metalness: 0.02
  });
  return nthuCalligraphyMat;
}

/**
 * 建立清華大學校門「簡冊立柱」：
 * - 3 根獨立垂直長方體立柱並列（保留真實透空垂直間隙，展現古代竹簡「簡冊」層疊造型）
 * - 柱頂呈階梯式微幅高低遞減（前主柱最高、中柱次之、後柱略低）
 * - 每根立柱皆具三段式雙道環繞凸出水平腰線（約 1/3、2/3 高度與柱頂冠部）
 * - 主柱頂端設有金屬避雷針，中段寬面鑲嵌直排「國立清華大學」題字
 */
export function createNthuGateMonument(pos = [0, 0, 0], rotY = -0.44) {
  const group = new THREE.Group();
  group.position.set(pos[0], pos[1], pos[2]);
  group.rotation.y = rotY;

  const ivoryMain = '#f0ede3';
  const ivoryTrim = '#e5e0d2';
  const baseDark = '#6c7370';

  // 底部微墊高花崗石收邊基座
  group.add(makeBox([1.28, 0.08, 1.56], baseDark, { r: 0.02, pos: [0, 0.04, 0] }));

  // 三片竹簡立柱規格（寬度 w=0.88，單柱厚度 d=0.33，柱間透空縫隙 gap=0.11 -> 清楚透光！）
  const slips = [
    { z: 0.44, x: 0.05, h: 4.88, isMain: true },   // 最前主簡（最高，鑲嵌「國立清華大學」）
    { z: 0.0,  x: 0.0,  h: 4.64, isMain: false },  // 中間竹簡
    { z: -0.44, x: -0.05, h: 4.40, isMain: false } // 後方竹簡
  ];

  const slipW = 0.88;
  const slipD = 0.33;

  slips.forEach(slip => {
    const pillar = new THREE.Group();
    pillar.position.set(slip.x, 0.08, slip.z);

    // 主柱身
    pillar.add(makeBox([slipW, slip.h, slipD], ivoryMain, { r: 0.018, pos: [0, slip.h / 2, 0] }));

    // 柱頂微縮階梯冠帽
    pillar.add(makeBox([slipW * 0.9, 0.14, slipD * 0.88], ivoryMain, { r: 0.012, pos: [0, slip.h + 0.07, 0] }));

    // 三段式雙層凸出水平腰線（1/3 處、2/3 處、頂冠下方）
    const bandHeights = [1.54, 3.18, slip.h - 0.28];
    for (const by of bandHeights) {
      pillar.add(makeBox([slipW + 0.07, 0.042, slipD + 0.065], ivoryTrim, { r: 0.008, pos: [0, by - 0.038, 0] }));
      pillar.add(makeBox([slipW + 0.075, 0.046, slipD + 0.07], ivoryMain, { r: 0.008, pos: [0, by + 0.032, 0] }));
    }

    if (slip.isMain) {
      // 中段（第一與第二腰線之間 y=1.60 ~ 3.12）正面貼附高解析直排「國立清華大學」
      const plaqueH = 1.46;
      const plaqueW = 0.49;
      const plaqueGeo = getCachedGeo('nthu-plaque', () => new THREE.PlaneGeometry(plaqueW, plaqueH));
      const frontPlaque = new THREE.Mesh(plaqueGeo, getNthuInscriptionMaterial());
      frontPlaque.position.set(0, 2.36, slipD / 2 + 0.004);
      pillar.add(frontPlaque);

      // 柱頂細長金屬避雷針（還原實景附圖 1 & 2 頂端細節）
      pillar.add(makeCyl(0.01, 0.016, 0.48, '#6e7780', { seg: 6, pos: [0, slip.h + 0.36, 0] }));
    }

    group.add(pillar);
  });

  return group;
}

// ============================================================================
// 2. 共用微縮自然景觀元件（榕樹、針葉樹、花圃、路燈、長椅）
// ============================================================================
export function createLushTree(pos = [0, 0, 0], scale = 1, leafColor = '#58a34c') {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  const h = 1.05 * scale;
  g.add(makeCyl(0.085 * scale, 0.13 * scale, h, '#7d5233', { seg: 7, pos: [0, h / 2, 0] }));
  g.add(makeIco(0.54 * scale, leafColor, { pos: [0, h + 0.24 * scale, 0] }));
  g.add(makeIco(0.36 * scale, '#68b357', { pos: [0.3 * scale, h + 0.06 * scale, 0.12 * scale] }));
  g.add(makeIco(0.38 * scale, '#4c9242', { pos: [-0.28 * scale, h + 0.1 * scale, -0.12 * scale] }));
  return g;
}

export function createBanyanTree(pos = [0, 0, 0], scale = 1) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  const h = 1.32 * scale;
  g.add(makeCyl(0.16 * scale, 0.25 * scale, h, '#6f482b', { seg: 8, pos: [0, h / 2, 0] }));
  g.add(makeCyl(0.05 * scale, 0.08 * scale, 0.58 * scale, '#6f482b', { seg: 6, pos: [0.24 * scale, h - 0.08 * scale, 0], rot: [0, 0, -0.68] }));
  g.add(makeCyl(0.05 * scale, 0.08 * scale, 0.58 * scale, '#6f482b', { seg: 6, pos: [-0.22 * scale, h - 0.1 * scale, 0.06 * scale], rot: [0.2, 0, 0.68] }));

  // 榕樹氣根細節
  g.add(makeCyl(0.015 * scale, 0.015 * scale, 0.65 * scale, '#855a3a', { seg: 5, pos: [0.38 * scale, h * 0.55, 0.1 * scale] }));
  g.add(makeCyl(0.015 * scale, 0.015 * scale, 0.6 * scale, '#855a3a', { seg: 5, pos: [-0.35 * scale, h * 0.52, -0.08 * scale] }));

  const crowns = [
    [0, 0.48, 0, 0.82, '#478f42'],
    [0.58, 0.24, 0.18, 0.58, '#55a14b'],
    [-0.56, 0.28, -0.12, 0.6, '#4d9846'],
    [0.12, 0.34, -0.52, 0.52, '#5fae52'],
    [-0.14, 0.2, 0.52, 0.52, '#478f42']
  ];
  for (const [cx, cy, cz, cr, col] of crowns) {
    g.add(makeIco(cr * scale, col, { pos: [cx * scale, h + cy * scale, cz * scale], scale: [1.15, 0.82, 1.1] }));
  }
  return g;
}

export function createPineTree(pos = [0, 0, 0], scale = 1, color = '#438951') {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.add(makeCyl(0.065 * scale, 0.085 * scale, 0.42 * scale, '#784d2e', { seg: 6, pos: [0, 0.21 * scale, 0] }));
  g.add(makeCone(0.44 * scale, 0.78 * scale, color, { seg: 7, pos: [0, 0.66 * scale, 0] }));
  g.add(makeCone(0.32 * scale, 0.62 * scale, '#519c5d', { seg: 7, pos: [0, 1.08 * scale, 0] }));
  return g;
}

export function createParkLamp(pos = [0, 0, 0]) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.add(makeCyl(0.028, 0.04, 0.96, '#3e4a52', { seg: 6, pos: [0, 0.48, 0] }));
  g.add(makeSphere(0.095, '#fbe8a8', { seg: 10, material: glowWindowMat, pos: [0, 1.0, 0], castShadow: false }));
  return g;
}

export function createWoodenBench(pos = [0, 0, 0], rotY = 0) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.y = rotY;
  g.add(makeBox([0.72, 0.05, 0.24], '#c2834b', { r: 0.01, pos: [0, 0.22, 0] }));
  g.add(makeBox([0.72, 0.18, 0.04], '#c2834b', { r: 0.01, pos: [0, 0.34, -0.1] }));
  g.add(makeBox([0.05, 0.22, 0.2], '#525b61', { pos: [-0.3, 0.11, 0] }));
  g.add(makeBox([0.05, 0.22, 0.2], '#525b61', { pos: [0.3, 0.11, 0] }));
  return g;
}

// ============================================================================
// 3. 動態微縮人物、腳踏車騎士、小機車與可點擊松鼠/蔬食小精靈彩蛋 (userData.dyn = true)
// ============================================================================
const SKIN_TONES = ['#f4cba2', '#ecc096', '#f7d6b5', '#dfb188'];
const HAIR_TONES = ['#28201a', '#3b2b20', '#1d1916', '#4c3626'];

export function createMiniPerson({
  shirt = '#ffffff',
  pants = '#314259',
  hat = null,
  holding = null,
  pose = 'stand',
  seed = 1,
  scale = 0.92,
  pos = [0, 0, 0],
  rotY = 0,
  route = null,
  speed = 0.42,
  registerAnim
}) {
  const root = new THREE.Group();
  root.userData.dyn = true;
  root.position.set(pos[0], pos[1], pos[2]);
  root.rotation.y = rotY;

  const body = new THREE.Group();
  body.scale.setScalar(scale);
  if (pose === 'sit') body.position.y = -0.06;
  root.add(body);

  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const hair = HAIR_TONES[seed % HAIR_TONES.length];

  const legL = new THREE.Group();
  legL.position.set(-0.06, 0.24, 0);
  legL.add(makeBox([0.09, 0.24, 0.1], pants, { r: 0.03, pos: [0, -0.12, 0] }));
  const legR = new THREE.Group();
  legR.position.set(0.06, 0.24, 0);
  legR.add(makeBox([0.09, 0.24, 0.1], pants, { r: 0.03, pos: [0, -0.12, 0] }));
  if (pose === 'sit') {
    legL.rotation.x = -Math.PI / 2;
    legR.rotation.x = -Math.PI / 2;
  }
  body.add(legL, legR);

  // 軀幹與頭部
  body.add(makeBox([0.26, 0.3, 0.17], shirt, { r: 0.06, pos: [0, 0.39, 0] }));
  body.add(makeSphere(0.13, skin, { seg: 12, pos: [0, 0.66, 0] }));
  body.add(makeSphere(0.136, hair, { seg: 12, thetaLength: Math.PI * 0.55, pos: [0, 0.69, -0.015] }));
  body.add(makeSphere(0.016, '#222222', { seg: 6, pos: [-0.045, 0.66, 0.12], castShadow: false }));
  body.add(makeSphere(0.016, '#222222', { seg: 6, pos: [0.045, 0.66, 0.12], castShadow: false }));

  // 手臂與手持物（環保杯 / 蔬食碗）
  const armL = new THREE.Group();
  armL.position.set(-0.16, 0.5, 0);
  armL.add(makeBox([0.07, 0.23, 0.08], shirt, { r: 0.03, pos: [0, -0.11, 0] }));
  const armR = new THREE.Group();
  armR.position.set(0.16, 0.5, 0);
  armR.add(makeBox([0.07, 0.23, 0.08], shirt, { r: 0.03, pos: [0, -0.11, 0] }));

  if (holding === 'cup') {
    armR.rotation.x = -0.65;
    armR.add(makeCyl(0.042, 0.032, 0.11, '#79c2a8', { seg: 8, pos: [0, -0.23, 0.07] }));
  } else if (holding === 'bowl') {
    armR.rotation.x = -0.7;
    armR.add(makeSphere(0.075, '#d95f43', { seg: 10, thetaStart: Math.PI / 2, thetaLength: Math.PI / 2, pos: [-0.04, -0.23, 0.09] }));
  } else if (pose === 'wave') {
    armR.rotation.z = 2.4;
  }
  body.add(armL, armR);

  if (hat === 'chef') {
    body.add(makeCyl(0.11, 0.1, 0.12, '#ffffff', { seg: 10, pos: [0, 0.82, 0] }));
    body.add(makeSphere(0.13, '#ffffff', { seg: 10, pos: [0, 0.91, 0] }));
  } else if (hat === 'sun') {
    body.add(makeCyl(0.22, 0.22, 0.025, '#e8c468', { seg: 12, pos: [0, 0.76, 0] }));
  }

  // 路徑往復行走動畫
  if (route && route.length >= 2 && registerAnim) {
    const segs = [];
    let totalLen = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i];
      const b = route[i + 1];
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      segs.push({ a, b, len, start: totalLen });
      totalLen += len;
    }
    registerAnim(elapsed => {
      if (totalLen <= 0.01) return;
      const cycle = totalLen * 2;
      let d = (elapsed * speed + seed * 1.3) % cycle;
      let dir = 1;
      if (d > totalLen) {
        d = cycle - d;
        dir = -1;
      }
      const seg = segs.find(s => d <= s.start + s.len) || segs[segs.length - 1];
      const t = seg.len > 0 ? (d - seg.start) / seg.len : 0;
      const x = seg.a[0] + (seg.b[0] - seg.a[0]) * t;
      const y = seg.a[1] + (seg.b[1] - seg.a[1]) * t;
      const z = seg.a[2] + (seg.b[2] - seg.a[2]) * t;
      root.position.set(x, y, z);
      root.rotation.y = Math.atan2((seg.b[0] - seg.a[0]) * dir, (seg.b[2] - seg.a[2]) * dir);
      const swing = Math.sin(elapsed * 8.5 + seed) * 0.48;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      if (!holding) armR.rotation.x = -swing * 0.7;
      armL.rotation.x = swing * 0.7;
      body.position.y = Math.abs(Math.sin(elapsed * 8.5 + seed)) * 0.028;
    });
  } else if (pose === 'wave' && registerAnim) {
    registerAnim(elapsed => {
      armR.rotation.z = 2.35 + Math.sin(elapsed * 5.5 + seed) * 0.35;
    });
  }

  return root;
}

/**
 * 致敬 VEG_MAP.jpg 之紅色單車 / 橘色小機車雲橋騎士 (userData.dyn = true)
 */
export function createBridgeCyclist({ hub, shop, kind = 'bike', seed = 1, registerAnim }) {
  const root = new THREE.Group();
  root.userData.dyn = true;

  const vehicle = new THREE.Group();
  vehicle.scale.setScalar(0.82);
  root.add(vehicle);

  if (kind === 'scooter') {
    // VEG_MAP.jpg 右下角橘色小機車造型
    vehicle.add(makeTorus(0.14, 0.045, '#2b2f33', { pos: [0, 0.16, 0.3], rot: [0, Math.PI / 2, 0] }));
    vehicle.add(makeTorus(0.14, 0.045, '#2b2f33', { pos: [0, 0.16, -0.28], rot: [0, Math.PI / 2, 0] }));
    vehicle.add(makeBox([0.24, 0.22, 0.62], '#ea7a2e', { r: 0.06, pos: [0, 0.28, -0.02] }));
    vehicle.add(makeBox([0.22, 0.36, 0.12], '#ea7a2e', { r: 0.04, pos: [0, 0.44, 0.24], rot: [-0.2, 0, 0] }));
    vehicle.add(makeBox([0.38, 0.04, 0.04], '#4a555c', { pos: [0, 0.63, 0.2] }));
    vehicle.add(makeBox([0.22, 0.07, 0.3], '#3b332e', { r: 0.02, pos: [0, 0.41, -0.1] }));
  } else {
    // VEG_MAP.jpg 左上角紅色腳踏車造型
    vehicle.add(makeTorus(0.16, 0.03, '#2b2f33', { pos: [0, 0.18, 0.28], rot: [0, Math.PI / 2, 0] }));
    vehicle.add(makeTorus(0.16, 0.03, '#2b2f33', { pos: [0, 0.18, -0.28], rot: [0, Math.PI / 2, 0] }));
    vehicle.add(makeCyl(0.02, 0.02, 0.52, '#d9483b', { seg: 6, pos: [0, 0.32, 0], rot: [Math.PI / 2.3, 0, 0] }));
    vehicle.add(makeCyl(0.02, 0.02, 0.34, '#d9483b', { seg: 6, pos: [0, 0.38, 0.22], rot: [-0.2, 0, 0] }));
    vehicle.add(makeBox([0.34, 0.03, 0.03], '#4a555c', { pos: [0, 0.56, 0.19] }));
  }

  // 騎士小人
  const rider = createMiniPerson({
    shirt: kind === 'scooter' ? '#fff3d6' : '#8ed1c8',
    pants: '#2f3e56',
    hat: 'sun',
    pose: 'sit',
    seed,
    scale: 0.85,
    pos: [0, 0.26, -0.05]
  });
  vehicle.add(rider);

  const hubEdge = (hub.islandRadius || 5.5) * Math.cos(Math.PI / 8);
  const shopEdge = (shop.islandRadius || 3.8) * Math.cos(Math.PI / 8);
  const dx = shop.x - hub.x;
  const dz = shop.z - hub.z;
  const totalDist = Math.hypot(dx, dz);
  const ux = dx / totalDist;
  const uz = dz / totalDist;
  const startR = hubEdge + 0.2;
  const endR = totalDist - shopEdge - 0.2;
  const span = Math.max(1, endR - startR);
  const archH = shop.ring === 'inner' ? 0.75 : 1.35;
  const speed = kind === 'scooter' ? 0.21 : 0.16;

  if (registerAnim) {
    registerAnim(elapsed => {
      const raw = ((elapsed * speed + seed * 0.37) % 2);
      const t = raw <= 1 ? raw : 2 - raw;
      const forward = raw <= 1 ? 1 : -1;
      const dist = startR + t * span;
      const y = hub.baseY * (1 - t) + shop.baseY * t + 0.07 + Math.sin(t * Math.PI) * archH;
      root.position.set(ux * dist, y, uz * dist);
      root.rotation.y = Math.atan2(ux * forward, uz * forward);
    });
  }

  return root;
}

/**
 * 可點擊跳躍並冒出對話氣泡之「清大松鼠 & 青花菜蔬食小精靈」尋寶彩蛋
 */
export function createInteractiveCritter({
  id,
  kind = 'squirrel',
  speech = '吱吱！吃蔬食愛地球！',
  pos = [0, 0, 0],
  rotY = 0,
  registerAnim,
  registerCritter
}) {
  const root = new THREE.Group();
  root.userData.dyn = true;
  root.position.set(pos[0], pos[1], pos[2]);
  root.rotation.y = rotY;

  const body = new THREE.Group();
  root.add(body);

  if (kind === 'broccoli') {
    // VEG_MAP.jpg 招牌可愛綠花椰菜小精靈
    body.add(makeCyl(0.11, 0.085, 0.24, '#8cc468', { seg: 10, pos: [0, 0.12, 0] }));
    body.add(makeIco(0.19, '#3e8c4c', { pos: [0, 0.31, 0] }));
    body.add(makeIco(0.13, '#4da358', { pos: [0.13, 0.27, 0.06] }));
    body.add(makeIco(0.13, '#387d44', { pos: [-0.13, 0.27, -0.04] }));
    body.add(makeSphere(0.02, '#1c2221', { seg: 6, pos: [-0.045, 0.16, 0.095], castShadow: false }));
    body.add(makeSphere(0.02, '#1c2221', { seg: 6, pos: [0.045, 0.16, 0.095], castShadow: false }));
  } else {
    // 清大校園名物：蓬鬆大尾巴赤腹松鼠
    body.add(makeSphere(0.12, '#8f5b34', { seg: 10, scale: [0.85, 1.05, 1.25], pos: [0, 0.14, 0] }));
    body.add(makeSphere(0.088, '#9c663c', { seg: 10, pos: [0, 0.26, 0.1] }));
    body.add(makeSphere(0.072, '#ead2ae', { seg: 8, scale: [0.75, 0.9, 0.6], pos: [0, 0.13, 0.07] }));
    // 蓬鬆捲曲大尾巴
    body.add(makeSphere(0.11, '#7a4b28', { seg: 10, scale: [0.7, 1.35, 0.85], pos: [0, 0.24, -0.16], rot: [-0.35, 0, 0] }));
    body.add(makeSphere(0.085, '#8f5b34', { seg: 8, pos: [0, 0.37, -0.14] }));
    // 耳朵與黑亮眼睛
    body.add(makeCone(0.028, 0.065, '#7a4b28', { seg: 5, pos: [-0.045, 0.34, 0.09] }));
    body.add(makeCone(0.028, 0.065, '#7a4b28', { seg: 5, pos: [0.045, 0.34, 0.09] }));
    body.add(makeSphere(0.016, '#14110f', { seg: 6, pos: [-0.038, 0.27, 0.175], castShadow: false }));
    body.add(makeSphere(0.016, '#14110f', { seg: 6, pos: [0.038, 0.27, 0.175], castShadow: false }));
  }

  // 已尋獲頭頂金色小菱形星芒
  const starGeo = getCachedGeo('critter-star', () => new THREE.OctahedronGeometry(0.065, 0));
  const starMat = getCachedGeo('critter-star-mat', () => new THREE.MeshBasicMaterial({ color: '#ffd23f' }));
  const starMesh = new THREE.Mesh(starGeo, starMat);
  starMesh.position.set(0, 0.56, 0);
  starMesh.visible = false;
  root.add(starMesh);

  // 透明放大點擊感應球（手機手指與滑鼠皆極易點中）
  const hitGeo = getCachedGeo('critter-hit', () => new THREE.SphereGeometry(0.42, 8, 6));
  const hitMat = getCachedGeo('critter-hit-mat', () => new THREE.MeshBasicMaterial({ visible: false }));
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);
  hitSphere.position.set(0, 0.25, 0);
  root.add(hitSphere);

  let hopTimer = 0;
  const phase = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 0.37;

  if (registerAnim) {
    registerAnim((elapsed, dt) => {
      if (hopTimer > 0) {
        hopTimer = Math.max(0, hopTimer - dt * 2.4);
      }
      const hopY = Math.sin(hopTimer * Math.PI) * 0.42;
      const idleBob = Math.abs(Math.sin(elapsed * 2.6 + phase)) * 0.035;
      body.position.y = hopY + idleBob;
      body.rotation.y = Math.sin(elapsed * 1.5 + phase) * 0.28 + (hopTimer > 0 ? Math.sin(hopTimer * Math.PI * 2) * 0.4 : 0);
      if (starMesh.visible) {
        starMesh.rotation.y = elapsed * 2.8;
      }
    });
  }

  if (registerCritter) {
    registerCritter(hitSphere, {
      id,
      kind,
      speech,
      markFound() {
        starMesh.visible = true;
      },
      onHop() {
        hopTimer = 1;
        starMesh.visible = true;
      }
    });
  }

  return root;
}

// ============================================================================
// 3.5 清大校園熱門 75 秒號誌燈（橫式三色箱＋右側讀秒器，綠燈75s/黃燈5s/紅燈75s）
// ============================================================================
export function createNthuControversyTrafficLight({
  pos = [-3.15, 0.04, -0.15],
  rotY = 0.08,
  registerAnim,
  registerCritter
}) {
  const root = new THREE.Group();
  root.position.set(pos[0], pos[1], pos[2]);
  root.rotation.y = rotY;
  root.userData.dyn = true;

  // 1. 金屬燈桿基座與曲臂挑桿立柱（還原圖 2 頂部弧度延伸之彎管鋼柱）
  const steelMid = '#4a535c';
  const steelDark = '#25292e';

  // 地面法蘭基座
  root.add(makeCyl(0.15, 0.17, 0.12, steelDark, { seg: 8, pos: [0, 0.06, 0] }));

  // 主垂直鋼管（高約 2.5m）
  root.add(makeCyl(0.045, 0.045, 2.3, steelMid, { seg: 8, pos: [0, 1.25, 0] }));

  // 頂部弧形彎管挑臂（向路中前伸）
  const armSegments = [
    { p: [0.03, 2.45, 0], r: [0, 0, -0.25], l: 0.28 },
    { p: [0.15, 2.62, 0], r: [0, 0, -0.65], l: 0.32 },
    { p: [0.36, 2.76, 0], r: [0, 0, -1.15], l: 0.35 },
    { p: [0.65, 2.82, 0], r: [0, 0, -Math.PI / 2], l: 0.42 }
  ];
  armSegments.forEach(s => {
    root.add(makeCyl(0.038, 0.038, s.l, steelMid, { seg: 6, pos: s.p, rot: s.r }));
  });

  // 2. 橫式號誌總成 (依圖 2：左側橫向三色燈箱 + 右側方形 LED 讀秒箱)
  const assembly = new THREE.Group();
  assembly.position.set(0.95, 2.82, 0);

  // 橫向三色燈箱外殼（寬 0.76, 高 0.28, 厚 0.16）
  assembly.add(makeBox([0.76, 0.28, 0.16], '#1b1e22', { r: 0.02, pos: [-0.18, 0, 0] }));
  // 黃黑邊背板增加辨識度
  assembly.add(makeBox([0.84, 0.34, 0.03], '#14171a', { r: 0.02, pos: [-0.18, 0, -0.09] }));

  // 三顆獨立鏡面材質（左至右：紅燈、黃燈、綠燈）
  const redMat = new THREE.MeshStandardMaterial({
    color: 0x440808,
    emissive: 0xff1100,
    emissiveIntensity: 0.15,
    roughness: 0.25,
    metalness: 0.1
  });
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0x443008,
    emissive: 0xffaa00,
    emissiveIntensity: 0.15,
    roughness: 0.25,
    metalness: 0.1
  });
  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x083315,
    emissive: 0x00ff66,
    emissiveIntensity: 2.6,
    roughness: 0.25,
    metalness: 0.1
  });

  const lensGeo = getCachedGeo('sphere_0.075_12_8', () => new THREE.SphereGeometry(0.075, 12, 8));

  // 左燈：紅燈（Red，最左邊）
  const redLens = new THREE.Mesh(lensGeo, redMat);
  redLens.scale.set(1, 1, 0.45);
  redLens.position.set(-0.42, 0, 0.08);

  // 中燈：黃燈（Yellow，中間）
  const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
  yellowLens.scale.set(1, 1, 0.45);
  yellowLens.position.set(-0.18, 0, 0.08);

  // 右燈：綠燈（Green，最右邊靠讀秒箱）
  const greenLens = new THREE.Mesh(lensGeo, greenMat);
  greenLens.scale.set(1, 1, 0.45);
  greenLens.position.set(0.06, 0, 0.08);

  assembly.add(redLens, yellowLens, greenLens);

  // 3. 右側方形 LED 雙位數讀秒箱 (圖 2)
  const timerW = 128;
  const timerH = 128;
  const timerCanvas = document.createElement('canvas');
  timerCanvas.width = timerW;
  timerCanvas.height = timerH;
  const timerCtx = timerCanvas.getContext('2d');
  const timerTex = new THREE.CanvasTexture(timerCanvas);
  timerTex.colorSpace = THREE.SRGBColorSpace;

  const timerMat = new THREE.MeshBasicMaterial({ map: timerTex });
  const timerBox = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.14), timerMat);
  timerBox.position.set(0.38, 0, 0);
  assembly.add(timerBox);

  // 讀秒箱遮罩與邊框
  assembly.add(makeBox([0.38, 0.04, 0.18], steelDark, { pos: [0.38, 0.18, 0.02] }));
  assembly.add(makeBox([0.38, 0.38, 0.02], '#14171a', { pos: [0.38, 0, -0.08] }));

  root.add(assembly);

  // 4. 倒數邏輯與號誌切換狀態機（綠燈 75 秒、黃燈 5 秒、紅燈 75 秒，全週期 155 秒）
  let lastSecond = -1;
  let currentPhase = ''; // 'green' | 'yellow' | 'red'

  const updateDisplay = (secondsLeft, phase) => {
    timerCtx.fillStyle = '#0a0d10';
    timerCtx.fillRect(0, 0, timerW, timerH);

    timerCtx.strokeStyle = phase === 'green' ? '#00bb44' : phase === 'yellow' ? '#dd9900' : '#dd2211';
    timerCtx.lineWidth = 6;
    timerCtx.strokeRect(4, 4, timerW - 8, timerH - 8);

    timerCtx.fillStyle = phase === 'green' ? '#00ff66' : phase === 'yellow' ? '#ffcc00' : '#ff3322';
    timerCtx.font = '900 66px "Courier New", monospace, sans-serif';
    timerCtx.textAlign = 'center';
    timerCtx.textBaseline = 'middle';
    const text = String(secondsLeft).padStart(2, '0');
    timerCtx.fillText(text, timerW / 2, timerH / 2 + 3);
    timerTex.needsUpdate = true;
  };

  if (registerAnim) {
    registerAnim(elapsed => {
      // 週期 155 秒
      const cycleTime = elapsed % 155;
      let phase = 'green';
      let secLeft = 0;

      if (cycleTime < 75) {
        // 綠燈 75 秒 (0 ~ 75)
        phase = 'green';
        secLeft = Math.ceil(75 - cycleTime);
      } else if (cycleTime < 80) {
        // 黃燈 5 秒 (75 ~ 80)
        phase = 'yellow';
        secLeft = Math.ceil(80 - cycleTime);
      } else {
        // 紅燈 75 秒 (80 ~ 155)
        phase = 'red';
        secLeft = Math.ceil(155 - cycleTime);
      }

      // 更新鏡面發光強度
      if (phase !== currentPhase) {
        currentPhase = phase;
        if (phase === 'green') {
          greenMat.emissiveIntensity = 2.8;
          yellowMat.emissiveIntensity = 0.08;
          redMat.emissiveIntensity = 0.08;
        } else if (phase === 'yellow') {
          greenMat.emissiveIntensity = 0.08;
          yellowMat.emissiveIntensity = 2.8;
          redMat.emissiveIntensity = 0.08;
        } else {
          greenMat.emissiveIntensity = 0.08;
          yellowMat.emissiveIntensity = 0.08;
          redMat.emissiveIntensity = 2.8;
        }
      }

      // 秒數變動時重繪 LED Canvas
      if (secLeft !== lastSecond) {
        lastSecond = secLeft;
        updateDisplay(secLeft, phase);
      }
    });
  }

  // 初始繪製一次倒數面板
  updateDisplay(75, 'green');

  // 5. 註冊為可點擊彩蛋
  if (registerCritter) {
    const hitGeo = getCachedGeo('sphere_hit_traffic_0.8', () => new THREE.SphereGeometry(0.8, 8, 8));
    const hitMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
    const hitSphere = new THREE.Mesh(hitGeo, hitMat);
    hitSphere.position.set(0.75, 2.8, 0);
    root.add(hitSphere);

    registerCritter(hitSphere, {
      id: 'critter-nthu-traffic-light',
      kind: 'traffic_light',
      speech: '清大 75 秒號誌燈：綠燈75秒、黃燈5秒、紅燈75秒！請遵守交通安全，減速慢行 🚦',
      onHop() {
        // 點選微幅輕晃
        assembly.rotation.z = 0.08;
        setTimeout(() => { assembly.rotation.z = 0; }, 360);
      }
    });
  }

  return root;
}

// ============================================================================
// 4. 組裝中央主島場景：清華簡冊立柱校門 + 石板廣場 + 環形綠籬榕樹 + 成功湖 + 福青攤位
// ============================================================================
export function buildCentralNthuHubScene(group, { registerAnim, registerCritter }) {
  // 1. 灰青幾何拼花石板廣場（還原附圖 1 & 3 校門前方青斗石/深淺灰石磚地面）
  group.add(makeCyl(3.35, 3.35, 0.04, '#8d9895', { seg: 16, pos: [0, 0.02, -0.1] }));
  const tileColors = ['#77827f', '#98a3a0', '#697370', '#a3aeab'];
  for (let gx = -5; gx <= 5; gx++) {
    for (let gz = -5; gz <= 5; gz++) {
      const tx = gx * 0.52;
      const tz = gz * 0.52 - 0.1;
      if (Math.hypot(tx, tz + 0.1) > 2.95) continue;
      if ((gx + gz * 3) % 2 === 0) {
        group.add(
          makeBox([0.46, 0.046, 0.46], tileColors[Math.abs(gx * 3 + gz) % tileColors.length], {
            pos: [tx, 0.024, tz]
          })
        );
      }
    }
  }

  // 2. 中央核心地標：清華大學校門「簡冊立柱」（置於廣場核心微偏北，呈最佳 3/4 立體視角）
  group.add(createNthuGateMonument([0.15, 0.04, -0.45], -0.44));

  // 3. 弧形修剪綠籬灌木叢與濃密校園大榕樹群（還原附圖 1、2、3 立柱後方與側邊濃密綠意）
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.85 + (i / 8) * Math.PI * 0.82;
    const hr = 2.05;
    group.add(
      makeBox([0.48, 0.34, 0.36], i % 2 === 0 ? '#559649' : '#65a856', {
        r: 0.12,
        pos: [0.15 + Math.cos(a) * hr, 0.2, -0.45 + Math.sin(a) * hr],
        rot: [0, -a + Math.PI / 2, 0]
      })
    );
  }

  group.add(createBanyanTree([-2.85, 0, -1.95], 1.12));
  group.add(createBanyanTree([2.75, 0, -2.15], 1.05));
  group.add(createLushTree([-3.65, 0, 0.45], 0.92, '#4e9647'));
  group.add(createPineTree([3.7, 0, -0.25], 0.95));

  // 4. 微縮「成功湖」景觀（對齊 VEG_MAP.jpg 清華大學旁之成功湖與湖畔綠樹）
  const lakeGroup = new THREE.Group();
  lakeGroup.position.set(-1.95, 0.02, 2.35);
  lakeGroup.add(makeCyl(1.42, 1.45, 0.06, '#d8ccb4', { seg: 20, pos: [0, 0.02, 0] }));
  lakeGroup.add(makeCyl(1.26, 1.26, 0.07, '#6ebcc2', { seg: 20, material: lakeWaterMat, pos: [0, 0.032, 0] }));
  // 湖畔克難坡小石與綠柳樹
  lakeGroup.add(makeIco(0.22, '#8b9492', { pos: [-0.95, 0.14, -0.65], scale: [1.3, 0.8, 1.0] }));
  lakeGroup.add(makeIco(0.16, '#9aa3a1', { pos: [-0.72, 0.1, -0.85] }));
  lakeGroup.add(createLushTree([-1.15, 0, 0.65], 0.78, '#66b561'));
  // 湖上小紅拱橋意象（成功湖九曲橋/湖心亭縮影）
  lakeGroup.add(makeBox([0.85, 0.06, 0.28], '#c95c48', { r: 0.02, pos: [0.25, 0.12, 0.1], rot: [0, 0.4, 0] }));
  group.add(lakeGroup);

  // 5. 「清大福青蔬食月」主題木質攤位（青瓷綠與胡蘿蔔橘相間頂棚）
  const booth = new THREE.Group();
  booth.position.set(2.15, 0.04, 1.85);
  booth.rotation.y = -0.45;
  // 攤位木桌與四柱
  booth.add(makeBox([1.65, 0.68, 0.78], '#e9d5b4', { r: 0.04, pos: [0, 0.34, 0] }));
  booth.add(makeBox([1.72, 0.07, 0.86], '#b8834f', { r: 0.02, pos: [0, 0.7, 0] }));
  for (const [px, pz] of [[-0.75, -0.32], [0.75, -0.32], [-0.75, 0.32], [0.75, 0.32]]) {
    booth.add(makeCyl(0.035, 0.035, 1.55, '#8c6239', { seg: 6, pos: [px, 0.78, pz] }));
  }
  // 條紋遮陽頂棚
  for (let s = -2; s <= 2; s++) {
    booth.add(
      makeBox([0.35, 0.12, 1.02], s % 2 === 0 ? '#4a8584' : '#ea7a2e', {
        r: 0.02,
        pos: [s * 0.34, 1.58, 0.04],
        rot: [0.12, 0, 0]
      })
    );
  }
  // 依據圖 1 改為夜間翡翠綠高辨識度 LED 發光路牌效果
  booth.add(makeSignBoard('福青蔬食月', '#0e7b4b', '#ffffff', 0.30, [0, 1.85, 0.42], [0, 0, 0], { isLed: true, frameColor: '#072418' }));

  // LED 燈牌夜間投射綠光光源（呼應圖 1 LED 路牌夜間高辨識度照明效果）
  const ledGlowLight = new THREE.PointLight('#5df2a8', 0, 3.6, 1.8);
  ledGlowLight.position.set(0, 1.84, 0.52);
  ledGlowLight.userData = { dyn: true, noMerge: true };
  booth.add(ledGlowLight);
  if (registerAnim) {
    registerAnim(() => {
      ledGlowLight.intensity = (glowWindowMat.emissiveIntensity > 0.4)
        ? Math.min(1.4, (glowWindowMat.emissiveIntensity - 0.3) * 0.75)
        : 0;
    });
  }
  // 攤位桌面蔬食餐盒與環保杯
  booth.add(makeBox([0.34, 0.08, 0.26], '#79b865', { r: 0.02, pos: [-0.42, 0.77, 0.08] }));
  booth.add(makeCyl(0.06, 0.048, 0.16, '#f4a259', { seg: 8, pos: [0.08, 0.81, 0.1] }));
  booth.add(makeCyl(0.055, 0.045, 0.15, '#68b0ab', { seg: 8, pos: [0.38, 0.8, 0.06] }));
  group.add(booth);

  // 廣場長椅與夜間暖光路燈
  group.add(createWoodenBench([-2.15, 0.04, -0.15], 0.9));
  group.add(createParkLamp([-1.55, 0.04, -2.55]));
  group.add(createParkLamp([2.35, 0.04, -0.45]));
  group.add(createParkLamp([0.45, 0.04, 3.55]));

  // 5.5 清大校園 75 秒號誌燈（依使用者圖 1 紅線：移至長椅左後方草坪，懸臂橫向往右伸出，零穿模避開西北大樹）
  group.add(
    createNthuControversyTrafficLight({
      pos: [-3.15, 0.04, -0.15],
      rotY: 0.08,
      registerAnim,
      registerCritter
    })
  );

  // 6. 動態清大學生與福青社招手社員 (userData.dyn = true)
  group.add(
    createMiniPerson({
      shirt: '#78a95b',
      pants: '#2c3e50',
      pose: 'wave',
      seed: 2,
      pos: [1.85, 0.04, 1.25],
      rotY: -0.35,
      registerAnim
    })
  );
  group.add(
    createMiniPerson({
      shirt: '#ffffff',
      pants: '#34495e',
      holding: 'cup',
      seed: 5,
      route: [
        [-0.85, 0.04, 1.65],
        [0.95, 0.04, 0.85],
        [0.65, 0.04, -1.65]
      ],
      speed: 0.45,
      registerAnim
    })
  );
  group.add(
    createMiniPerson({
      shirt: '#f6d365',
      pants: '#2f3e56',
      holding: 'bowl',
      seed: 8,
      route: [
        [1.15, 0.04, 2.95],
        [-0.55, 0.04, 2.65]
      ],
      speed: 0.38,
      registerAnim
    })
  );

  // 7. 主島隱藏尋寶彩蛋：清大赤腹松鼠 & 青花菜小精靈
  group.add(
    createInteractiveCritter({
      id: 'critter-hub-squirrel',
      kind: 'squirrel',
      speech: '吱吱！歡迎來到清華簡冊校門浮島！',
      pos: [-2.25, 0.04, -1.42],
      rotY: 0.7,
      registerAnim,
      registerCritter
    })
  );
  group.add(
    createInteractiveCritter({
      id: 'critter-hub-broccoli',
      kind: 'broccoli',
      speech: '邀請你出一張嘴，吃蔬食改變世界！',
      pos: [3.15, 0.04, 1.65],
      rotY: -0.6,
      registerAnim,
      registerCritter
    })
  );
}
