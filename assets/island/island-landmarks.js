// 2026 清大福青社蔬食地圖 — 中央清華主島、「簡冊立柱」校門地標與共用微縮植被/角色/彩蛋積木庫
// 100% 純程式碼基本幾何拼裝（零外部 GLTF/FBX 模型），靜態零件自動納入同材質 mergeGeometries。

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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

// 福智青年社蔬食宣傳專屬隨機對話庫（中英雙語對照）
export const BOOTH_SPEECHES = [
  '福智青年社邀請您來場蔬食冒險吧！一起闖關拿好禮，吃蔬食，健康自己也打造健康的地球\nThe Bliss and Wisdom Youth Club invites you to a plant-based adventure! Join our games, win great prizes, and embrace delicious plant-based meals for your health and our planet.',
  '🌟 11/1 - 11/7 菜不是配角 (靜態理念展覽) 📍校本部：旺宏館 1F 穿堂\n"Veggies Take Center Stage" (Static Exhibition) 📍Main Campus: Learning Resources Center (Macronix Building) 1F Hallway',
  '🌟 11/11 10:00～16:00 蔬食玩家養成記 (小遊戲闖關) 📍校本部：運動會擺攤（位置另行公布於粉專、IG）\n"Veggie Player Level-Up" (Mini-Games & Challenges) 📍Main Campus: Sports Day Booth (Exact location announced on FB & IG)',
  '🌟 11/18 19:00~20:30 一口愛地球 (料理實作) 📍校本部：風雲樓三樓國際青年活動中心\n"A Bite to Love the Earth" (Hands-on Cooking Workshop) 📍Main Campus: Feng-Yun Building 3F, International Youth Activity Center',
  '🌟 11/25 19:00~20:30 吃「蔬」地球的微笑 (活動總結， 現場依據「賓果卡」完成度進行抽獎)  📍校本部：風雲樓三樓國際青年活動中心\n"Smile with Veggies for the Earth" (Lucky draw held on-site based on your Bingo Card completion) 📍Main Campus: Feng-Yun Building 3F, International Youth Activity Center',
  '改變，從選擇開始，把握每日用餐的機會，以蔬食疼惜生命、守護地球。\nChange begins with choice. Cherish life and protect the planet with plant-based meals every day.'
];

export function getRandomBoothSpeech() {
  return BOOTH_SPEECHES[Math.floor(Math.random() * BOOTH_SPEECHES.length)];
}

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
  registerAnim,
  isPolo = false,
  badgeColor = null,
  hairStyle = 'short',
  registerCritter = null,
  critterMeta = null
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
  if (isPolo) {
    // POLO 衫領片立體結構
    body.add(makeBox([0.16, 0.035, 0.05], shirt, { r: 0.01, pos: [0, 0.54, 0.08], rot: [0.18, 0, 0] }));
  }

  body.add(makeSphere(0.13, skin, { seg: 12, pos: [0, 0.66, 0] }));
  body.add(makeSphere(0.136, hair, { seg: 12, thetaLength: Math.PI * 0.55, pos: [0, 0.69, -0.015] }));
  if (hairStyle === 'long') {
    // 圖 4 齊肩微捲髮
    body.add(makeBox([0.24, 0.22, 0.16], hair, { r: 0.05, pos: [0, 0.62, -0.05] }));
  }

  body.add(makeSphere(0.016, '#222222', { seg: 6, pos: [-0.045, 0.66, 0.12], castShadow: false }));
  body.add(makeSphere(0.016, '#222222', { seg: 6, pos: [0.045, 0.66, 0.12], castShadow: false }));

  // 手臂與手持物（依 isPolo 實現短袖與右袖標，或長袖）
  const armL = new THREE.Group();
  armL.position.set(-0.16, 0.5, 0);
  const armR = new THREE.Group();
  armR.position.set(0.16, 0.5, 0);

  if (isPolo) {
    // 短袖 POLO 衫手臂：上段為短袖，下段為小手臂與手部
    armL.add(makeBox([0.075, 0.11, 0.085], shirt, { r: 0.02, pos: [0, -0.05, 0] }));
    armL.add(makeBox([0.06, 0.12, 0.07], skin, { r: 0.02, pos: [0, -0.16, 0] }));

    armR.add(makeBox([0.075, 0.11, 0.085], shirt, { r: 0.02, pos: [0, -0.05, 0] }));
    armR.add(makeBox([0.06, 0.12, 0.07], skin, { r: 0.02, pos: [0, -0.16, 0] }));

    // 右手臂短袖袖標（圖 3 紅色標 / 圖 4 白色標）
    if (badgeColor) {
      armR.add(makeBox([0.015, 0.04, 0.04], badgeColor, { pos: [0.04, -0.05, 0] }));
    }
  } else {
    armL.add(makeBox([0.07, 0.23, 0.08], shirt, { r: 0.03, pos: [0, -0.11, 0] }));
    armR.add(makeBox([0.07, 0.23, 0.08], shirt, { r: 0.03, pos: [0, -0.11, 0] }));
  }

  if (holding === 'cup') {
    armR.rotation.x = -0.65;
    armR.add(makeCyl(0.042, 0.032, 0.11, '#79c2a8', { seg: 8, pos: [0, -0.23, 0.07] }));
  } else if (holding === 'bowl') {
    armR.rotation.x = -0.7;
    armR.add(makeSphere(0.075, '#d95f43', { seg: 10, thetaStart: Math.PI / 2, thetaLength: Math.PI / 2, pos: [-0.04, -0.23, 0.09] }));
  } else if (holding === 'mic') {
    // 圖 3 右手持握麥克風宣傳蔬食
    armR.rotation.x = -0.75;
    armR.rotation.y = -0.2;
    armR.add(makeCyl(0.016, 0.014, 0.13, '#1c1f24', { seg: 8, pos: [0, -0.21, 0.06], rot: [0.3, 0, 0] }));
    armR.add(makeSphere(0.024, '#c6cbd2', { seg: 8, pos: [0, -0.15, 0.08] }));
  } else if (pose === 'wave') {
    armR.rotation.z = 2.4;
  }
  body.add(armL, armR);

  // 點擊判定球與 Q 彈回饋動畫
  if (registerCritter && critterMeta) {
    const hitGeo = getCachedGeo('sphere_hit_mini_person_0.6', () => new THREE.SphereGeometry(0.6, 8, 8));
    const hitMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.set(0, 0.55, 0);
    root.add(hitMesh);

    critterMeta.onHop = () => {
      let t = 0;
      const startY = root.position.y;
      if (registerAnim) {
        registerAnim((dt) => {
          t += dt * 10;
          root.position.y = startY + Math.sin(t) * 0.12;
          if (t >= Math.PI) {
            root.position.y = startY;
            return false;
          }
        });
      }
    };
    registerCritter(hitMesh, critterMeta);
  }

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

// Parallel-Transport (Bishop Frame) 零扭轉變徑圓管（支援開放端半球封口或閉合環 loop）
function makePandaVariableTube(controlNodes, material, tubularSegs = 36, radialSegs = 18, closed = false) {
  const pts = controlNodes.map(n => new THREE.Vector3(...n.p));
  const curve = new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.45);

  const radiusAt = t => {
    if (closed) {
      const n = controlNodes.length;
      const scaled = (t % 1) * n;
      const i0 = Math.floor(scaled) % n;
      const i1 = (i0 + 1) % n;
      const f = scaled - Math.floor(scaled);
      const s = f * f * (3 - 2 * f);
      return controlNodes[i0].r * (1 - s) + controlNodes[i1].r * s;
    }
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

  const ref = new THREE.Vector3(0, 1, 0);
  if (Math.abs(tangents[0].dot(ref)) > 0.85) ref.set(0, 0, 1);
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

  if (closed) {
    const nStart = normals[0];
    const nEnd = normals[tubularSegs];
    const bStart = binormals[0];
    const twistErr = Math.atan2(nEnd.dot(bStart), nEnd.dot(nStart));
    for (let i = 1; i <= tubularSegs; i++) {
      const corr = -twistErr * (i / tubularSegs);
      normals[i].applyAxisAngle(tangents[i], corr).normalize();
      binormals[i].crossVectors(tangents[i], normals[i]).normalize();
    }
  }

  const capRings = 5;
  const rings = [];

  if (!closed) {
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

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    rings.push({
      center: curve.getPointAt(t),
      N: normals[i],
      B: binormals[i],
      r: radiusAt(t)
    });
  }

  if (!closed) {
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

function makePandaEllipsoid(r, scale, pos, material, seg = 28, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, seg, Math.round(seg * 0.8)),
    material
  );
  m.scale.set(scale[0], scale[1], scale[2]);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

let nthuPandaPrototype = null;

/**
 * 建立清大吉祥物熊貓「清華胖達」單例 3D 模型（NTHU 清華紫連帽衫・坐姿絨毛版）
 * 建構一次後依材質合併為 8 個精簡 Mesh，供全場 6 座浮島零拷貝共用緩衝區。
 */
function getNthuPandaPrototype() {
  if (nthuPandaPrototype) return nthuPandaPrototype;

  const raw = new THREE.Group();

  const matWhiteFur = mat('#f6f5f0', { roughness: 0.90, metalness: 0.01 });
  const matBlackFur = mat('#1c1d21', { roughness: 0.88, metalness: 0.02 });
  const matHoodie = mat('#5f50a3', { roughness: 0.85, metalness: 0.01 });
  const matHoodieRib = mat('#554696', { roughness: 0.88, metalness: 0.01 });
  const matLetter = mat('#fcfcfa', { roughness: 0.62, metalness: 0.02 });
  const matIris = mat('#753d18', { roughness: 0.28, metalness: 0.04 });
  const matPupil = mat('#0d0e11', { roughness: 0.12, metalness: 0.06 });
  const matHighlight = mat('#ffffff', { roughness: 0.10, emissive: '#ffffff', emissiveIntensity: 0.28 });

  // 1. 坐姿白色絨毛下腹臀部底座 ＋ 背後圓滾滾白色小尾巴
  raw.add(makePandaEllipsoid(1.0, [0.335, 0.195, 0.305], [0, 0.195, -0.01], matWhiteFur, 34));
  raw.add(makePandaEllipsoid(0.072, [1.0, 0.95, 1.05], [0, 0.155, -0.305], matWhiteFur, 18));

  // 2. 坐姿向前外八字伸出的黑色圓胖雙腿與厚實微翹大腳掌
  for (const s of [-1, 1]) {
    const legNodes = [
      { p: [s * 0.145, 0.135, 0.06], r: 0.116 },
      { p: [s * 0.205, 0.108, 0.21], r: 0.112 },
      { p: [s * 0.255, 0.102, 0.345], r: 0.106 }
    ];
    raw.add(makePandaVariableTube(legNodes, matBlackFur, 22, 18));
    raw.add(
      makePandaEllipsoid(
        0.142,
        [0.90, 1.16, 0.72],
        [s * 0.278, 0.142, 0.415],
        matBlackFur,
        24,
        [-0.24, s * 0.40, -s * 0.08]
      )
    );
  }

  // 3. 清華紫連帽衫主軀幹（LatheGeometry 一體成形，含下擺羅紋束口細節）
  const hoodieProfile = [
    new THREE.Vector2(0.001, 0.175),
    new THREE.Vector2(0.315, 0.182),
    new THREE.Vector2(0.356, 0.208),
    new THREE.Vector2(0.345, 0.238),
    new THREE.Vector2(0.364, 0.315),
    new THREE.Vector2(0.354, 0.415),
    new THREE.Vector2(0.322, 0.515),
    new THREE.Vector2(0.262, 0.595),
    new THREE.Vector2(0.160, 0.640),
    new THREE.Vector2(0.001, 0.650)
  ];
  const hoodiePts = new THREE.SplineCurve(hoodieProfile).getPoints(48);
  const hScaleX = 1.07;
  const hScaleZ = 0.94;
  const hoodieGeo = new THREE.LatheGeometry(hoodiePts, 40);
  const hoodieMesh = new THREE.Mesh(hoodieGeo, matHoodie);
  hoodieMesh.scale.set(hScaleX, 1.0, hScaleZ);
  raw.add(hoodieMesh);

  function hoodieRadiusAtY(y) {
    let best = hoodiePts[0].x;
    let minDiff = Infinity;
    for (const p of hoodiePts) {
      const d = Math.abs(p.y - y);
      if (d < minDiff) {
        minDiff = d;
        best = p.x;
      }
    }
    return best;
  }

  function hoodieFrontZ(x, y) {
    const r = hoodieRadiusAtY(y);
    const rx = r * hScaleX;
    const rz = r * hScaleZ;
    const t = 1 - (x / rx) ** 2;
    return t > 0 ? rz * Math.sqrt(t) : 0;
  }

  const hemNodes = [];
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const r = 0.350;
    hemNodes.push({
      p: [Math.cos(ang) * r * hScaleX, 0.205, Math.sin(ang) * r * hScaleZ],
      r: 0.022
    });
  }
  raw.add(makePandaVariableTube(hemNodes, matHoodieRib, 36, 12, true));

  // 4. 厚實連帽堆疊領圈與背後自然垂墜連帽帽兜
  const collarNodes = [
    { p: [0.00, 0.578, 0.268], r: 0.068 },
    { p: [0.19, 0.592, 0.195], r: 0.072 },
    { p: [0.29, 0.615, 0.015], r: 0.076 },
    { p: [0.21, 0.640, -0.195], r: 0.080 },
    { p: [0.00, 0.654, -0.262], r: 0.084 },
    { p: [-0.21, 0.640, -0.195], r: 0.080 },
    { p: [-0.29, 0.615, 0.015], r: 0.076 },
    { p: [-0.19, 0.592, 0.195], r: 0.072 }
  ];
  raw.add(makePandaVariableTube(collarNodes, matHoodie, 42, 18, true));

  const hoodCurveNodes = [
    { p: [-0.18, 0.615, -0.225], r: 0.072 },
    { p: [-0.13, 0.510, -0.295], r: 0.098 },
    { p: [0.00, 0.455, -0.320], r: 0.118 },
    { p: [0.13, 0.510, -0.295], r: 0.098 },
    { p: [0.18, 0.615, -0.225], r: 0.072 }
  ];
  raw.add(makePandaVariableTube(hoodCurveNodes, matHoodie, 28, 16));
  raw.add(makePandaEllipsoid(1.0, [0.205, 0.135, 0.095], [0, 0.545, -0.268], matHoodie, 24, [0.25, 0, 0]));

  // 5. 左右微張迎賓的紫色衣袖 ＋ 同軸羅紋折邊袖口 ＋ 黑色絨毛小圓手
  for (const s of [-1, 1]) {
    const sleeveNodes = [
      { p: [s * 0.215, 0.525, 0.015], r: 0.102 },
      { p: [s * 0.352, 0.495, 0.048], r: 0.110 },
      { p: [s * 0.462, 0.436, 0.092], r: 0.102 },
      { p: [s * 0.542, 0.382, 0.132], r: 0.090 }
    ];
    raw.add(makePandaVariableTube(sleeveNodes, matHoodie, 24, 18));

    const sCurve = new THREE.CatmullRomCurve3(
      sleeveNodes.map(n => new THREE.Vector3(...n.p)),
      false,
      'catmullrom',
      0.45
    );
    const cuffCenter = sCurve.getPointAt(0.97);
    const sleeveDir = sCurve.getTangentAt(1.0).normalize();
    const refUp = new THREE.Vector3(0, 1, 0);
    const uAxis = new THREE.Vector3().crossVectors(refUp, sleeveDir).normalize();
    const vAxis = new THREE.Vector3().crossVectors(sleeveDir, uAxis).normalize();

    const cuffRingNodes = [];
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      const rad = 0.076;
      const pt = cuffCenter.clone()
        .addScaledVector(uAxis, Math.cos(a) * rad)
        .addScaledVector(vAxis, Math.sin(a) * rad);
      cuffRingNodes.push({ p: [pt.x, pt.y, pt.z], r: 0.023 });
    }
    raw.add(makePandaVariableTube(cuffRingNodes, matHoodieRib, 28, 12, true));

    const pawPos = sCurve.getPointAt(1.0).addScaledVector(sleeveDir, 0.048);
    const pawMesh = new THREE.Mesh(new THREE.SphereGeometry(0.082, 22, 18), matBlackFur);
    pawMesh.position.copy(pawPos);
    pawMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sleeveDir);
    pawMesh.scale.set(0.95, 1.08, 0.92);
    raw.add(pawMesh);
  }

  // 6. 胸前立體白色「NTHU」刺繡字樣（嚴格貼合毛衣曲面法線）
  function addEmbroideryStroke(pts2D, strokeR = 0.0125) {
    const subPts = [];
    const stepsPerSeg = 5;
    for (let i = 0; i < pts2D.length - 1; i++) {
      const [x0, y0] = pts2D[i];
      const [x1, y1] = pts2D[i + 1];
      const count = i === pts2D.length - 2 ? stepsPerSeg : stepsPerSeg - 1;
      for (let k = 0; k <= count; k++) {
        const f = k / stepsPerSeg;
        const x = x0 + (x1 - x0) * f;
        const y = y0 + (y1 - y0) * f;
        const yCurved = y + (x * x) * 0.07;
        const z = hoodieFrontZ(x, yCurved) + strokeR * 0.55;
        subPts.push({ p: [x, yCurved, z], r: strokeR });
      }
    }
    raw.add(makePandaVariableTube(subPts, matLetter, Math.max(10, subPts.length * 2), 10));
  }

  const yTop = 0.444;
  const yBot = 0.348;
  const yMid = (yTop + yBot) * 0.5;
  addEmbroideryStroke([[-0.168, yBot], [-0.168, yTop]]);
  addEmbroideryStroke([[-0.168, yTop], [-0.104, yBot]]);
  addEmbroideryStroke([[-0.104, yBot], [-0.104, yTop]]);
  addEmbroideryStroke([[-0.074, yTop], [-0.008, yTop]]);
  addEmbroideryStroke([[-0.041, yTop], [-0.041, yBot]]);
  addEmbroideryStroke([[0.016, yBot], [0.016, yTop]]);
  addEmbroideryStroke([[0.080, yBot], [0.080, yTop]]);
  addEmbroideryStroke([[0.016, yMid], [0.080, yMid]]);

  const uPts = [[0.110, yTop], [0.110, yBot + 0.032]];
  for (let k = 1; k <= 7; k++) {
    const ang = Math.PI + (k / 8) * Math.PI;
    uPts.push([0.142 + Math.cos(ang) * 0.032, yBot + 0.032 + Math.sin(ang) * 0.032]);
  }
  uPts.push([0.174, yBot + 0.032], [0.174, yTop]);
  addEmbroideryStroke(uPts);

  // 7. 飽滿大圓白絨毛頭 ＋ 兩隻圓滾滾毛球黑色大耳朵
  const headCy = 0.878;
  const headCz = 0.020;
  const headRx = 0.394;
  const headRy = 0.338;
  const headRz = 0.348;
  raw.add(makePandaEllipsoid(1.0, [headRx, headRy, headRz], [0, headCy, headCz], matWhiteFur, 42));

  function headFrontZ(x, y) {
    const t = 1 - (x / headRx) ** 2 - ((y - headCy) / headRy) ** 2;
    return t > 0 ? headCz + headRz * Math.sqrt(t) : headCz;
  }

  function headNormal(x, y, z) {
    return new THREE.Vector3(
      x / (headRx * headRx),
      (y - headCy) / (headRy * headRy),
      (z - headCz) / (headRz * headRz)
    ).normalize();
  }

  for (const s of [-1, 1]) {
    raw.add(
      makePandaEllipsoid(
        0.140,
        [1.04, 1.04, 0.84],
        [s * 0.296, 1.156, -0.012],
        matBlackFur,
        26,
        [0.06, -s * 0.14, -s * 0.45]
      )
    );
  }

  // 8. 球面曲率貼合「正八字 (/ \) 水滴黑眼圈」＋ 琥珀棕邊黑眼珠 ＋ 白高光
  function makeConformingEyePatch(side) {
    const cx = side * 0.158;
    const cy = 0.876;
    const tiltAngle = 0.50;
    const upX = -side * Math.sin(tiltAngle);
    const upY = Math.cos(tiltAngle);
    const rightX = Math.cos(tiltAngle);
    const rightY = side * Math.sin(tiltAngle);

    const rings = 9;
    const segs = 30;
    const positions = [];
    const indices = [];

    const zCenterBase = headFrontZ(cx, cy);
    const nCenter = headNormal(cx, cy, zCenterBase);
    const liftMax = 0.014;
    positions.push(
      cx + nCenter.x * liftMax,
      cy + nCenter.y * liftMax,
      zCenterBase + nCenter.z * liftMax
    );

    for (let ir = 1; ir <= rings; ir++) {
      const rho = ir / rings;
      const lift = liftMax * Math.cos(rho * Math.PI * 0.5) - 0.003 * (rho * rho);

      for (let is = 0; is < segs; is++) {
        const theta = (is / segs) * Math.PI * 2;
        const rawU = Math.cos(theta);
        const rawV = Math.sin(theta);
        const widthFactor = 1.0 - 0.17 * rawV;
        const u = rawU * 0.088 * widthFactor * rho;
        const v = rawV * 0.122 * rho;

        const px = cx + u * rightX + v * upX;
        const py = cy + u * rightY + v * upY;
        const pzBase = headFrontZ(px, py);
        const nrm = headNormal(px, py, pzBase);

        positions.push(
          px + nrm.x * lift,
          py + nrm.y * lift,
          pzBase + nrm.z * lift
        );
      }
    }

    for (let is = 0; is < segs; is++) {
      const next = (is + 1) % segs;
      indices.push(0, 1 + is, 1 + next);
    }

    for (let ir = 1; ir < rings; ir++) {
      const startCurr = 1 + (ir - 1) * segs;
      const startNext = 1 + ir * segs;
      for (let is = 0; is < segs; is++) {
        const next = (is + 1) % segs;
        const a = startCurr + is;
        const b = startNext + is;
        const c = startNext + next;
        const d = startCurr + next;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, matBlackFur);
  }

  for (const s of [-1, 1]) {
    raw.add(makeConformingEyePatch(s));

    const ex = s * 0.128;
    const ey = 0.904;
    const ez = headFrontZ(ex, ey);
    const eNorm = headNormal(ex, ey, ez);

    const irisPos = new THREE.Vector3(ex, ey, ez).addScaledVector(eNorm, 0.011);
    raw.add(
      makePandaEllipsoid(0.033, [1.0, 1.05, 0.65], [irisPos.x, irisPos.y, irisPos.z], matIris, 18, [-0.08, s * 0.32, 0])
    );

    const pupilPos = new THREE.Vector3(ex - s * 0.001, ey + 0.001, ez).addScaledVector(eNorm, 0.019);
    raw.add(
      makePandaEllipsoid(0.028, [1.0, 1.05, 0.68], [pupilPos.x, pupilPos.y, pupilPos.z], matPupil, 18, [-0.08, s * 0.32, 0])
    );

    const hiPos = pupilPos.clone().add(new THREE.Vector3(s * 0.005 + 0.007, 0.010, 0.016));
    raw.add(makePandaEllipsoid(0.0080, [1, 1, 0.8], [hiPos.x, hiPos.y, hiPos.z], matHighlight, 12));
  }

  // 9. 立體圓嘟嘟白絨毛吻部 ＋ 亮黑立體鼻頭 ＋ 垂直縫線小嘴
  const muzCy = 0.790;
  const muzCz = 0.305;
  const muzRx = 0.146;
  const muzRy = 0.112;
  const muzRz = 0.112;
  raw.add(makePandaEllipsoid(1.0, [muzRx, muzRy, muzRz], [0, muzCy, muzCz], matWhiteFur, 30));

  function muzzleFrontZ(x, y) {
    const t = 1 - (x / muzRx) ** 2 - ((y - muzCy) / muzRy) ** 2;
    const zM = t > 0 ? muzCz + muzRz * Math.sqrt(t) : -1;
    return Math.max(zM, headFrontZ(x, y));
  }

  const noseY = 0.822;
  const noseZ = muzzleFrontZ(0, noseY) + 0.008;
  raw.add(makePandaEllipsoid(0.030, [1.32, 0.86, 0.82], [0, noseY, noseZ], matPupil, 18, [0.16, 0, 0]));

  const mouthNodes = [];
  for (let i = 0; i <= 7; i++) {
    const f = i / 7;
    const my = 0.802 - f * 0.072;
    const mz = muzzleFrontZ(0, my) + 0.003;
    mouthNodes.push({ p: [0, my, mz], r: 0.0065 });
  }
  raw.add(makePandaVariableTube(mouthNodes, matBlackFur, 14, 10));

  // 將同材質網格一次性烘焙合併為 8 個精簡 Mesh，並縮放至微縮浮島完美比例 (高約 0.58m)
  raw.updateMatrixWorld(true);
  const buckets = new Map();
  for (const child of raw.children) {
    if (!child.isMesh) continue;
    let g = child.geometry.clone();
    if (g.index) g = g.toNonIndexed();
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== 'position' && attr !== 'normal') g.deleteAttribute(attr);
    }
    g.applyMatrix4(child.matrix);
    if (!buckets.has(child.material)) buckets.set(child.material, []);
    buckets.get(child.material).push(g);
    child.geometry.dispose();
  }

  const proto = new THREE.Group();
  for (const [material, geos] of buckets.entries()) {
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    proto.add(mesh);
  }
  proto.scale.setScalar(0.45);
  nthuPandaPrototype = proto;
  return nthuPandaPrototype;
}

/**
 * 可點擊跳躍並冒出對話氣泡之「清華松鼠 & 清華胖達」尋寶小夥伴
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

  const isPanda = kind === 'panda' || kind === 'broccoli';
  if (isPanda) {
    // 清大吉祥物熊貓「清華胖達」（穿著紫色 NTHU 連帽衫之黑白紫高辨識度坐姿熊貓）
    body.add(getNthuPandaPrototype().clone());
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

  // 已尋獲頭頂金色小菱形星芒（清華胖達身高約 0.58m，星芒置於耳頂上方 0.69m 零穿模）
  const starGeo = getCachedGeo('critter-star', () => new THREE.OctahedronGeometry(0.065, 0));
  const starMat = getCachedGeo('critter-star-mat', () => new THREE.MeshBasicMaterial({ color: '#ffd23f' }));
  const starMesh = new THREE.Mesh(starGeo, starMat);
  starMesh.position.set(0, isPanda ? 0.69 : 0.56, 0);
  starMesh.visible = false;
  root.add(starMesh);

  // 透明放大點擊感應球（手機手指與滑鼠皆極易點中）
  const hitGeo = getCachedGeo(isPanda ? 'critter-hit-panda' : 'critter-hit', () => new THREE.SphereGeometry(isPanda ? 0.46 : 0.42, 8, 6));
  const hitMat = getCachedGeo('critter-hit-mat', () => new THREE.MeshBasicMaterial({ visible: false }));
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);
  hitSphere.position.set(0, isPanda ? 0.29 : 0.25, 0);
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
      kind: isPanda ? 'panda' : kind,
      name: isPanda ? '清華胖達' : '清華松鼠',
      isCompanion: true,
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

  // 攤位前方志工 1（圖 2 紅框處：鵝黃色短袖 POLO 衫、深藍牛仔褲、手拿麥克風熱情宣傳，完全站於攤位前方零穿模）
  const staffYellow = createMiniPerson({
    shirt: '#fae260',
    pants: '#2c4e70',
    holding: 'mic',
    pose: 'stand',
    seed: 2,
    pos: [-0.46, 0, 0.82],
    rotY: 0.08,
    isPolo: true,
    badgeColor: '#b52328', // 圖 3 右臂紅色小方標
    registerAnim,
    registerCritter,
    critterMeta: {
      id: 'booth-staff-yellow',
      kind: 'staff',
      isCompanion: false,
      bubbleDuration: 7000,
      getSpeech: () => getRandomBoothSpeech()
    }
  });
  booth.add(staffYellow);

  // 攤位前方志工 2（圖 2 橘框處：大紅色短袖 POLO 衫、深藏青長褲、齊肩微捲髮微笑迎賓，完全站於攤位前方零穿模）
  const staffRed = createMiniPerson({
    shirt: '#b52328',
    pants: '#1e2432',
    seed: 6,
    pos: [0.22, 0, 0.85],
    rotY: -0.12,
    isPolo: true,
    badgeColor: '#ffffff', // 圖 4 右臂白色小方標
    hairStyle: 'long',
    registerAnim,
    registerCritter,
    critterMeta: {
      id: 'booth-staff-red',
      kind: 'staff',
      isCompanion: false,
      bubbleDuration: 7000,
      getSpeech: () => getRandomBoothSpeech()
    }
  });
  booth.add(staffRed);

  // 攤位本體可點擊碰撞盒（點擊攤位桌面或頂棚隨機播放福青蔬食宣傳對話）
  if (registerCritter) {
    const hitGeo = getCachedGeo('box_hit_booth_1.9_1.8_1.2', () => new THREE.BoxGeometry(1.9, 1.8, 1.2));
    const hitMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
    const hitBox = new THREE.Mesh(hitGeo, hitMat);
    hitBox.position.set(0, 0.9, 0.2);
    booth.add(hitBox);
    registerCritter(hitBox, {
      id: 'booth-table',
      kind: 'booth',
      isCompanion: false,
      bubbleDuration: 7000,
      getSpeech: () => getRandomBoothSpeech()
    });
  }

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

  // 6. 動態清大學生校園漫步 (userData.dyn = true)
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

  // 7. 主島隱藏尋寶彩蛋：清大赤腹松鼠 & 清華胖達
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
      id: 'critter-hub-panda',
      kind: 'panda',
      speech: '我是清華胖達！邀請你出一張嘴，吃蔬食改變世界！',
      pos: [3.65, 0.04, 1.25],
      rotY: -0.25,
      registerAnim,
      registerCritter
    })
  );
}
