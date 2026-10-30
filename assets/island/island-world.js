// 2026 清大福青社蔬食地圖 — 3D 積木幾何核心、同材質靜態合併、移軸微縮後製與天空之城環境引擎
// 遵循四大技術原則：(1) 100% 基本幾何拼裝零外部模型 (2) Tilt-Shift 移軸微縮後製且手機自動關閉
// (3) BufferGeometryUtils.mergeGeometries 同材質靜態合併保高 FPS (4) 單一島嶼碰撞體極速拾取

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ============================================================================
// 1. 幾何與材質單例快取池 (Singleton Primitive & Material Pool)
// ============================================================================
const geoCache = new Map();
const matCache = new Map();
const signTexCache = new Map();
const glowSignMaterials = [];

function keyNums(arr) {
  return arr.map(n => Math.round(n * 1000)).join(',');
}

export function getCachedGeo(key, factory) {
  if (!geoCache.has(key)) geoCache.set(key, factory());
  return geoCache.get(key);
}

export function mat(color, opts = {}) {
  const key = `${color}|${JSON.stringify(opts)}`;
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.78,
        metalness: 0.02,
        ...opts
      })
    );
  }
  return matCache.get(key);
}

// 夜晚會自動發光的共用窗戶與燈籠材質
export const glowWindowMat = new THREE.MeshStandardMaterial({
  color: '#fbe8a8',
  emissive: '#ffb84d',
  emissiveIntensity: 0.05,
  roughness: 0.38
});

export const glowJadeMat = new THREE.MeshStandardMaterial({
  color: '#8cebe2',
  emissive: '#4dd6c9',
  emissiveIntensity: 0.45,
  roughness: 0.25
});

export const lakeWaterMat = new THREE.MeshStandardMaterial({
  color: '#6ebcc2',
  roughness: 0.16,
  metalness: 0.08
});

// 圓角積木與基礎幾何建構器
export function makeBox(size = [1, 1, 1], color = '#ffffff', opts = {}) {
  const { r = 0, seg = 2, material, pos = [0, 0, 0], rot = [0, 0, 0], castShadow = true, receiveShadow = true, flat = false } = opts;
  const maxR = Math.max(0, Math.min(size[0], size[1], size[2]) * 0.48 - 0.001);
  const radius = Math.min(r, maxR);
  const geo = radius > 0.001
    ? getCachedGeo(`rb:${keyNums(size)}:${Math.round(radius * 1000)}:${seg}`, () => new RoundedBoxGeometry(size[0], size[1], size[2], seg, radius))
    : getCachedGeo(`bx:${keyNums(size)}`, () => new THREE.BoxGeometry(size[0], size[1], size[2]));
  const m = new THREE.Mesh(geo, material || mat(color, flat ? { flatShading: true } : {}));
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

export function makeCyl(rt = 0.5, rb = 0.5, h = 1, color = '#ffffff', opts = {}) {
  const { seg = 14, open = false, material, pos = [0, 0, 0], rot = [0, 0, 0], castShadow = true, receiveShadow = true, flat = false } = opts;
  const geo = getCachedGeo(`cy:${keyNums([rt, rb, h])}:${seg}:${open ? 1 : 0}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));
  const m = new THREE.Mesh(geo, material || mat(color, flat ? { flatShading: true } : {}));
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

export function makeSphere(r = 0.5, color = '#ffffff', opts = {}) {
  const { seg = 14, scale, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI, material, pos = [0, 0, 0], rot = [0, 0, 0], castShadow = true, receiveShadow = true, flat = false } = opts;
  const geo = getCachedGeo(
    `sp:${keyNums([r, phiStart, phiLength, thetaStart, thetaLength])}:${seg}`,
    () => new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.75)), phiStart, phiLength, thetaStart, thetaLength)
  );
  const m = new THREE.Mesh(geo, material || mat(color, flat ? { flatShading: true } : {}));
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

export function makeCone(r = 0.5, h = 1, color = '#ffffff', opts = {}) {
  const { seg = 12, material, pos = [0, 0, 0], rot = [0, 0, 0], scale, castShadow = true, receiveShadow = true, flat = true } = opts;
  const geo = getCachedGeo(`cn:${keyNums([r, h])}:${seg}`, () => new THREE.ConeGeometry(r, h, seg));
  const m = new THREE.Mesh(geo, material || mat(color, flat ? { flatShading: true } : {}));
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

export function makeIco(r = 0.5, color = '#5fae4e', opts = {}) {
  const { detail = 0, scale, material, pos = [0, 0, 0], rot = [0, 0, 0], castShadow = true, receiveShadow = true } = opts;
  const geo = getCachedGeo(`ic:${Math.round(r * 1000)}:${detail}`, () => new THREE.IcosahedronGeometry(r, detail));
  const m = new THREE.Mesh(geo, material || mat(color, { flatShading: true }));
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

export function makeTorus(r = 0.4, tube = 0.08, color = '#ffffff', opts = {}) {
  const { seg = 18, arc = Math.PI * 2, material, pos = [0, 0, 0], rot = [0, 0, 0], castShadow = true } = opts;
  const geo = getCachedGeo(`tr:${keyNums([r, tube, arc])}:${seg}`, () => new THREE.TorusGeometry(r, tube, 8, seg, arc));
  const m = new THREE.Mesh(geo, material || mat(color));
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = castShadow;
  return m;
}

export function makeGableRoof(w = 1.8, h = 0.55, d = 1.4, color = '#c8553d', opts = {}) {
  const { pos = [0, 0, 0], rot = [0, 0, 0] } = opts;
  const geo = getCachedGeo(`gr:${keyNums([w, h, d])}`, () => {
    const shape = new THREE.Shape();
    shape.moveTo(-d / 2, 0);
    shape.lineTo(d / 2, 0);
    shape.lineTo(0, h);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
    g.translate(0, 0, -w / 2);
    g.rotateY(Math.PI / 2);
    return g;
  });
  const m = new THREE.Mesh(geo, mat(color, { flatShading: true }));
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Canvas 招牌貼圖產生器（供建築店招與 LED 發光路牌使用，支援夜間發光與靜態幾何合併）
 */
export function makeSignBoard(text, bgColor = '#2c4a47', fgColor = '#fffaf2', h = 0.28, pos = [0, 0, 0], rot = [0, 0, 0], opts = {}) {
  const { isLed = false, frameColor = null } = opts;
  const cacheKey = `${text}|${bgColor}|${fgColor}|${isLed}`;
  let entry = signTexCache.get(cacheKey);
  if (!entry) {
    const pxH = 104;
    const pxW = Math.max(190, Math.round(pxH * (text.length * 0.95 + (isLed ? 1.0 : 0.8))));
    const canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      // 底色（若為 LED 路牌，使用圖 1 正統台灣翡翠綠路牌底色）
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, pxW, pxH);

      // 邊框：LED 路牌具備鮮明白色內嵌發光框
      ctx.strokeStyle = fgColor;
      ctx.globalAlpha = isLed ? 0.95 : 0.45;
      ctx.lineWidth = isLed ? 6 : 4;
      const pad = isLed ? 8 : 7;
      ctx.strokeRect(pad, pad, pxW - pad * 2, pxH - pad * 2);

      // 若為 LED 路牌，加上四角微縮固定鉚釘細節
      if (isLed) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (const [cx, cy] of [[pad + 7, pad + 7], [pxW - pad - 7, pad + 7], [pad + 7, pxH - pad - 7], [pxW - pad - 7, pxH - pad - 7]]) {
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = fgColor;
      ctx.font = '900 52px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, pxW / 2, pxH / 2 + 2);
      tex.needsUpdate = true;
    };
    draw();
    document.fonts?.load?.('900 48px "Noto Sans TC"', text).then(draw, () => {});

    const material = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.05,
      roughness: 0.35,
      metalness: 0.05
    });
    glowSignMaterials.push({ material, isLed });

    entry = {
      material,
      aspect: pxW / pxH
    };
    signTexCache.set(cacheKey, entry);
  }

  const w = h * entry.aspect;
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  if (rot[0] || rot[1] || rot[2]) g.rotation.set(rot[0], rot[1], rot[2]);

  // 外框（LED 路牌搭配深墨綠金屬背盒）
  const boxBackCol = frameColor || (isLed ? '#082118' : bgColor);
  g.add(makeBox([w + 0.05, h + 0.05, 0.04], boxBackCol, { r: 0.015, pos: [0, 0, -0.021] }));
  const faceGeo = getCachedGeo(`pl:${keyNums([w, h])}`, () => new THREE.PlaneGeometry(w, h));
  const face = new THREE.Mesh(faceGeo, entry.material);
  face.position.set(0, 0, 0.002);
  g.add(face);
  return g;
}

// ============================================================================
// 2. 同材質與頂點色靜態零件幾何合併器 (BufferGeometryUtils.mergeGeometries)
// ============================================================================
const NOOP_RAYCAST = () => {};

const bakedSmoothMat = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  vertexColors: true,
  roughness: 0.78,
  metalness: 0.02
});

const bakedFlatMat = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  vertexColors: true,
  flatShading: true,
  roughness: 0.78,
  metalness: 0.02
});

function isVertexColorBakeable(m) {
  if (!m || !m.isMeshStandardMaterial) return false;
  if (m === glowWindowMat || m === glowJadeMat || m === lakeWaterMat) return false;
  if (m.map || m.transparent) return false;
  return m.roughness === 0.78 && m.metalness === 0.02;
}

export function bakeStaticGroup(rootGroup, metrics = null) {
  rootGroup.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(rootGroup.matrixWorld).invert();
  const buckets = new Map();
  const staticMeshes = [];

  function collect(node) {
    if (node.userData?.dyn || node.userData?.noMerge) return;
    if (node.isMesh && node.visible && !Array.isArray(node.material)) {
      const srcGeo = node.geometry;
      let g = srcGeo.index ? srcGeo.toNonIndexed() : srcGeo.clone();
      const useVCol = isVertexColorBakeable(node.material);
      const targetMat = useVCol ? (node.material.flatShading ? bakedFlatMat : bakedSmoothMat) : node.material;
      const hasTex = Boolean(targetMat.map);
      const keep = useVCol ? ['position', 'normal', 'color'] : hasTex ? ['position', 'normal', 'uv'] : ['position', 'normal'];

      for (const attrName of Object.keys(g.attributes)) {
        if (!keep.includes(attrName)) g.deleteAttribute(attrName);
      }
      if (!g.attributes.normal) g.computeVertexNormals();
      if (hasTex && !g.attributes.uv) {
        const count = g.attributes.position.count;
        g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
      }
      if (useVCol) {
        const count = g.attributes.position.count;
        const cols = new Float32Array(count * 3);
        const c = node.material.color;
        for (let i = 0; i < count; i++) {
          cols[i * 3] = c.r;
          cols[i * 3 + 1] = c.g;
          cols[i * 3 + 2] = c.b;
        }
        g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      }

      const relMatrix = new THREE.Matrix4().multiplyMatrices(invRoot, node.matrixWorld);
      g.applyMatrix4(relMatrix);

      let bucket = buckets.get(targetMat);
      if (!bucket) {
        bucket = { geos: [], castShadow: false, receiveShadow: false };
        buckets.set(targetMat, bucket);
      }
      bucket.geos.push(g);
      bucket.castShadow = bucket.castShadow || node.castShadow;
      bucket.receiveShadow = bucket.receiveShadow || node.receiveShadow;
      staticMeshes.push(node);
    }
    for (const child of node.children) collect(child);
  }

  for (const child of [...rootGroup.children]) collect(child);

  if (metrics) metrics.rawStaticMeshes += staticMeshes.length;

  let mergedCount = 0;
  buckets.forEach((bucket, material) => {
    if (!bucket.geos.length) return;
    const mergedGeo = mergeGeometries(bucket.geos, false);
    bucket.geos.forEach(g => g.dispose());
    if (!mergedGeo) return;

    const mergedMesh = new THREE.Mesh(mergedGeo, material);
    mergedMesh.castShadow = bucket.castShadow;
    mergedMesh.receiveShadow = bucket.receiveShadow;
    mergedMesh.matrixAutoUpdate = false;
    mergedMesh.raycast = NOOP_RAYCAST;
    mergedMesh.userData.noMerge = true;
    rootGroup.add(mergedMesh);
    mergedCount++;
  });

  if (metrics) metrics.mergedStaticMeshes += mergedCount;

  // 移除原始零碎靜態子 Mesh，大幅減少每幀 Scene Graph 遍歷開銷
  for (const m of staticMeshes) {
    if (m.parent) m.parent.remove(m);
  }

  // 清除已騰空之純靜態中繼 Group
  function pruneEmptyGroups(parent) {
    for (const child of [...parent.children]) {
      if (child.userData?.dyn || child.userData?.noMerge || child.isMesh) continue;
      pruneEmptyGroups(child);
      if (child.children.length === 0) parent.remove(child);
    }
  }
  pruneEmptyGroups(rootGroup);
}

// ============================================================================
// 3. 移軸微縮後製著色器 (Tilt-Shift Miniature Postprocessing Shader)
// ============================================================================
const TiltShiftMiniatureShader = {
  uniforms: {
    tDiffuse: { value: null },
    uAspect: { value: 1.6 },
    uFocusY: { value: 0.5 },
    uFocusBand: { value: 0.21 },
    uBlur: { value: 0.0046 },
    uSaturation: { value: 1.09 },
    uVignette: { value: 0.22 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    uniform float uFocusY;
    uniform float uFocusBand;
    uniform float uBlur;
    uniform float uSaturation;
    uniform float uVignette;
    varying vec2 vUv;

    void main() {
      float edgeDist = max(0.0, abs(vUv.y - uFocusY) - uFocusBand) / max(0.05, 0.5 - uFocusBand);
      float radius = clamp(edgeDist * edgeDist, 0.0, 1.25) * uBlur;

      vec4 sum = texture2D(tDiffuse, vUv) * 0.26;
      if (radius > 0.00008) {
        vec2 rx = vec2(radius / max(0.5, uAspect), 0.0);
        vec2 ry = vec2(0.0, radius);
        vec2 d1 = vec2(rx.x * 0.707, ry.y * 0.707);
        vec2 d2 = vec2(-rx.x * 0.707, ry.y * 0.707);

        sum += texture2D(tDiffuse, vUv + rx) * 0.115;
        sum += texture2D(tDiffuse, vUv - rx) * 0.115;
        sum += texture2D(tDiffuse, vUv + ry) * 0.115;
        sum += texture2D(tDiffuse, vUv - ry) * 0.115;
        sum += texture2D(tDiffuse, vUv + d1) * 0.07;
        sum += texture2D(tDiffuse, vUv - d1) * 0.07;
        sum += texture2D(tDiffuse, vUv + d2) * 0.07;
        sum += texture2D(tDiffuse, vUv - d2) * 0.07;
      } else {
        sum = texture2D(tDiffuse, vUv);
      }

      vec3 col = sum.rgb;
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(luma), col, uSaturation);

      vec2 centered = vUv - 0.5;
      float vig = 1.0 - dot(centered, centered) * uVignette * 1.65;
      col *= clamp(vig, 0.72, 1.0);

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

// ============================================================================
// 4. 天空之城浮島底座、空中雲橋與雲海建構器
// ============================================================================
function createOctagonShape(radius) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function getOctSlabGeo(radius, depth, bevel = 0.1) {
  return getCachedGeo(`oct:${keyNums([radius, depth, bevel])}`, () => {
    const g = new THREE.ExtrudeGeometry(createOctagonShape(radius), {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 1
    });
    g.rotateX(-Math.PI / 2);
    return g;
  });
}

/**
 * 建立「天空之城」倒錐岩層浮島底座（含八角草地平台、主題色帶、倒錐多層岩盤、懸浮能量晶石與垂掛綠藤）
 */
export function createFloatingIslandBase(island) {
  const R = island.islandRadius || 3.8;
  const isHub = Boolean(island.isHub);
  const group = new THREE.Group();

  // 1. 頂層草地與主題識別色環
  const grassMesh = new THREE.Mesh(getOctSlabGeo(R, 0.24, 0.11), mat(island.grass || '#a8cca8'));
  grassMesh.position.y = -0.24;
  grassMesh.receiveShadow = true;
  grassMesh.castShadow = true;
  group.add(grassMesh);

  const stripeMesh = new THREE.Mesh(getOctSlabGeo(R * 0.992, 0.18, 0.06), mat(island.color || '#4a8584'));
  stripeMesh.position.y = -0.46;
  stripeMesh.castShadow = true;
  group.add(stripeMesh);

  const upperSoil = new THREE.Mesh(getOctSlabGeo(R * 0.96, 0.52, 0.1), mat('#c89c6c', { flatShading: true }));
  upperSoil.position.y = -0.98;
  upperSoil.castShadow = true;
  upperSoil.receiveShadow = true;
  group.add(upperSoil);

  // 2. 天空之城倒錐形多層岩塊底盤 (Inverted Craggy Cliff Underside)
  const depthScale = isHub ? 1.48 : 1.0;
  const rockTiers = [
    { rt: R * 0.92, rb: R * 0.68, h: 0.95 * depthScale, y: -1.42 * depthScale + (isHub ? 0.45 : 0), col: '#b0865c', rot: Math.PI / 8 },
    { rt: R * 0.70, rb: R * 0.42, h: 1.15 * depthScale, y: -2.35 * depthScale + (isHub ? 0.45 : 0), col: '#936f4f', rot: 0.22 },
    { rt: R * 0.44, rb: R * 0.12, h: 1.15 * depthScale, y: -3.35 * depthScale + (isHub ? 0.45 : 0), col: '#785b44', rot: -0.18 }
  ];
  for (const tier of rockTiers) {
    group.add(
      makeCyl(tier.rt, tier.rb, tier.h, tier.col, {
        seg: 8,
        flat: true,
        pos: [0, tier.y, 0],
        rot: [0, tier.rot, 0]
      })
    );
  }

  // 側邊不對稱凸出岩塊與垂掛綠藤
  const seedBase = (island.index || 0) * 7 + 3;
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2 + seedBase * 0.23;
    const dist = R * (0.64 + (i % 3) * 0.08);
    const ry = -1.05 - (i % 3) * 0.55 * depthScale;
    group.add(
      makeIco(0.46 + (i % 2) * 0.18, i % 2 === 0 ? '#9e7957' : '#856549', {
        pos: [Math.cos(ang) * dist, ry, Math.sin(ang) * dist],
        scale: [1.15, 0.85, 1.0]
      })
    );

    if (i % 2 === 0) {
      const vx = Math.cos(ang + 0.18) * (R * 0.93);
      const vz = Math.sin(ang + 0.18) * (R * 0.93);
      const vineLen = 0.65 + (i % 3) * 0.32;
      group.add(makeCyl(0.045, 0.025, vineLen, '#4f9654', { seg: 6, pos: [vx, -0.45 - vineLen / 2, vz] }));
      group.add(makeIco(0.12, '#63ad5c', { pos: [vx, -0.45 - vineLen, vz] }));
    }
  }

  // 底端懸浮青玉能量核心與環繞小浮石
  const tipY = isHub ? -4.75 : -3.95;
  group.add(
    makeIco(isHub ? 0.36 : 0.24, '#8cebe2', {
      material: glowJadeMat,
      pos: [0, tipY, 0],
      scale: [0.85, 1.45, 0.85]
    })
  );

  for (let k = 0; k < 3; k++) {
    const a = k * 2.1 + seedBase;
    const pr = R * 0.72 + k * 0.35;
    group.add(
      makeIco(0.18 + k * 0.05, '#a17c5b', {
        pos: [Math.cos(a) * pr, -2.1 - k * 0.65, Math.sin(a) * pr],
        scale: [1.2, 0.75, 1.0]
      })
    );
  }

  // 3. 單一簡化八角透明拾取碰撞體（讓 Raycaster 無須檢測數千個零件，滑鼠懸停零延遲）
  const hitGeo = getCachedGeo(`hit:${Math.round(R * 100)}`, () => new THREE.CylinderGeometry(R * 1.02, R * 0.82, 4.4, 8));
  const hitMat = getCachedGeo('hitMat', () => new THREE.MeshBasicMaterial({ visible: false }));
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 1.25;
  hitMesh.userData = { noMerge: true, islandId: island.id };

  return { baseGroup: group, hitMesh };
}

/**
 * 建立中央清華主島通往 10 座蔬食浮島之空中拱橋與雲朵單車浮石航道
 */
export function createSkyBridgesGroup(hub, shops) {
  const root = new THREE.Group();
  const hubEdge = (hub.islandRadius || 5.5) * Math.cos(Math.PI / 8) - 0.15;

  for (const shop of shops) {
    const shopEdge = (shop.islandRadius || 3.8) * Math.cos(Math.PI / 8) - 0.15;
    const dx = shop.x - hub.x;
    const dz = shop.z - hub.z;
    const totalDist = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);

    const startR = hubEdge;
    const endR = totalDist - shopEdge;
    const span = endR - startR;
    if (span <= 1) continue;

    const isInner = shop.ring === 'inner';
    const archH = isInner ? 0.75 : 1.35;
    const halfW = isInner ? 0.48 : 0.42;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.rotation.y = -angle;

    const heightAt = t => {
      const linearY = hub.baseY * (1 - t) + shop.baseY * t;
      return linearY + 0.03 + Math.sin(t * Math.PI) * archH;
    };

    if (isInner) {
      // 內環 5 家步行圈：溫暖木石空中拱橋 + 橋頭夜間發光小燈籠
      const plankCount = Math.max(10, Math.round(span / 0.34));
      for (let i = 0; i < plankCount; i++) {
        const t = (i + 0.5) / plankCount;
        const nextT = Math.min(1, t + 0.02);
        const slope = Math.atan2(heightAt(nextT) - heightAt(t), 0.02 * span);
        bridgeGroup.add(
          makeBox([0.28, 0.07, halfW * 2], i % 2 === 0 ? '#cfa06b' : '#dcb280', {
            r: 0.015,
            pos: [startR + t * span, heightAt(t), 0],
            rot: [0, 0, slope]
          })
        );
      }

      for (const sideZ of [halfW, -halfW]) {
        const railPts = Array.from({ length: 13 }, (_, idx) => {
          const t = idx / 12;
          return new THREE.Vector3(startR + t * span, heightAt(t) + 0.44, sideZ);
        });
        const beamPts = Array.from({ length: 13 }, (_, idx) => {
          const t = idx / 12;
          return new THREE.Vector3(startR + t * span, heightAt(t) - 0.06, sideZ);
        });

        const railGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 28, 0.032, 6, false);
        const beamGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(beamPts), 28, 0.065, 6, false);
        const railMesh = new THREE.Mesh(railGeo, mat('#fff6e5'));
        railMesh.castShadow = true;
        const beamMesh = new THREE.Mesh(beamGeo, mat('#8c6a4a'));
        beamMesh.castShadow = true;
        bridgeGroup.add(railMesh, beamMesh);

        for (let p = 0; p <= 6; p++) {
          const t = p / 6;
          const py = heightAt(t);
          const isEnd = p === 0 || p === 6;
          const postH = isEnd ? 0.64 : 0.46;
          bridgeGroup.add(makeBox([0.075, postH, 0.075], '#8c6a4a', { pos: [startR + t * span, py + postH / 2, sideZ] }));
          if (isEnd) {
            bridgeGroup.add(
              makeBox([0.12, 0.14, 0.12], '#fbe8a8', {
                material: glowWindowMat,
                pos: [startR + t * span, py + postH + 0.08, sideZ],
                castShadow: false
              })
            );
          }
        }
      }
    } else {
      // 外環 5 家單車 10 分鐘圈：輕盈雲朵浮石空中單車航道
      const stepCount = Math.max(14, Math.round(span / 1.05));
      for (let i = 0; i < stepCount; i++) {
        const t = (i + 0.5) / stepCount;
        const x = startR + t * span;
        const y = heightAt(t);
        bridgeGroup.add(
          makeCyl(0.38, 0.28, 0.14, i % 2 === 0 ? '#f3ead8' : '#f7cfa8', {
            seg: 8,
            flat: true,
            pos: [x, y - 0.04, 0]
          })
        );
        if (i % 4 === 2) {
          // 航道下方襯托小雲朵浮墊
          bridgeGroup.add(makeIco(0.42, '#ffffff', { pos: [x, y - 0.34, 0], scale: [1.35, 0.65, 1.1] }));
          bridgeGroup.add(makeIco(0.28, '#ffffff', { pos: [x + 0.3, y - 0.38, 0.22], scale: [1.1, 0.6, 1.0] }));
        }
      }
      // 柔和橘白雙軌空中導引細拱線
      for (const sideZ of [0.34, -0.34]) {
        const pts = Array.from({ length: 15 }, (_, idx) => {
          const t = idx / 14;
          return new THREE.Vector3(startR + t * span, heightAt(t) + 0.08, sideZ);
        });
        const guideGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.024, 5, false);
        bridgeGroup.add(new THREE.Mesh(guideGeo, mat('#f09d51')));
      }
    }

    root.add(bridgeGroup);
  }

  return root;
}

// ============================================================================
// 5. 四段日夜光影與新竹天氣配色定義 (對齊 VEG_MAP.jpg 青瓷粉彩色調)
// ============================================================================
const SKY_PALETTES = {
  day: {
    bg: '#a5cbc8',       // VEG_MAP.jpg 經典粉彩青瓷藍綠
    fog: '#c2dfdd',
    sun: '#fff6e3',
    sunI: 2.45,
    hemiSky: '#dcf2f0',
    hemiGround: '#b99368',
    hemiI: 1.18,
    glow: 0.04
  },
  dusk: {
    bg: '#d9a589',
    fog: '#e6bfa6',
    sun: '#ff9d5c',
    sunI: 2.05,
    hemiSky: '#ffd7ba',
    hemiGround: '#825f4d',
    hemiI: 0.95,
    glow: 0.95
  },
  night: {
    bg: '#1c313a',
    fog: '#243d47',
    sun: '#88b4e0',
    sunI: 0.78,
    hemiSky: '#3b6275',
    hemiGround: '#1c262b',
    hemiI: 0.68,
    glow: 2.2
  }
};

export function resolveTimePhase(timeMode) {
  if (timeMode === 'day' || timeMode === 'dusk' || timeMode === 'night') return timeMode;
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
  const h = new Date(utcMs + 8 * 3600000).getHours();
  if (h >= 6 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}

export function isMobileOrLowPower() {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 760 ||
    window.matchMedia?.('(pointer: coarse)').matches ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

// ============================================================================
// 6. 主世界控制器 (createIslandWorld)
// ============================================================================
export function createIslandWorld({
  container,
  dataset,
  skyLinks = [],
  buildHubScene,
  buildShopScene,
  buildSkyDecor,
  onSelectIsland,
  onHoverIsland,
  onClickCritter,
  onFrameLabels
}) {
  const mobileInit = isMobileOrLowPower();
  const metrics = {
    rawStaticMeshes: 0,
    mergedStaticMeshes: 0,
    drawCalls: 0,
    triangles: 0,
    fxEnabled: !mobileInit,
    isMobile: mobileInit
  };
  window.__ISLAND_METRICS__ = metrics;

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileInit ? 1.35 : 1.85));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Scene & Fog
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_PALETTES.day.bg);
  scene.fog = new THREE.Fog(SKY_PALETTES.day.fog, 62, 165);

  // Camera & Controls
  const camera = new THREE.PerspectiveCamera(
    container.clientWidth / container.clientHeight < 0.85 ? 42 : 31,
    container.clientWidth / container.clientHeight,
    0.5,
    320
  );
  camera.position.set(0, 34, 48);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 8;
  controls.maxDistance = 115;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minPolarAngle = 0.08;
  controls.target.set(0, 0.8, 1.5);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(SKY_PALETTES.day.hemiSky, SKY_PALETTES.day.hemiGround, SKY_PALETTES.day.hemiI);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(SKY_PALETTES.day.sun, SKY_PALETTES.day.sunI);
  dirLight.position.set(-26, 42, 24);
  dirLight.castShadow = true;
  const shadowRes = mobileInit ? 1024 : 2048;
  dirLight.shadow.mapSize.set(shadowRes, shadowRes);
  dirLight.shadow.camera.left = -36;
  dirLight.shadow.camera.right = 36;
  dirLight.shadow.camera.top = 36;
  dirLight.shadow.camera.bottom = -36;
  dirLight.shadow.camera.near = 2;
  dirLight.shadow.camera.far = 120;
  dirLight.shadow.bias = -0.0004;
  dirLight.shadow.normalBias = 0.028;
  scene.add(dirLight);

  // Tilt-Shift Miniature Postprocessing Pipeline (桌機預設開啟，手機自動關閉省電)
  let composer = null;
  let tiltPass = null;

  function ensureComposer() {
    if (composer) return;
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    const pr = renderer.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(Math.round(w * pr), Math.round(h * pr), {
      type: THREE.HalfFloatType,
      samples: mobileInit ? 0 : 4
    });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());
    tiltPass = new ShaderPass(TiltShiftMiniatureShader);
    tiltPass.uniforms.uAspect.value = w / h;
    composer.addPass(tiltPass);
  }

  if (metrics.fxEnabled) ensureComposer();

  // ==========================================================================
  // 建構 11 座天空之城浮島 + 靜態零件同材質幾何合併
  // ==========================================================================
  const islandEntries = [];
  const islandPickMeshes = [];
  const critterPickMeshes = [];
  const animCallbacks = [];

  const registerAnim = fn => animCallbacks.push(fn);
  const registerCritter = (hitObj, meta) => {
    hitObj.userData.critterMeta = meta;
    critterPickMeshes.push(hitObj);
  };

  dataset.allIslands.forEach((island, idx) => {
    const islandRoot = new THREE.Group();
    islandRoot.position.set(island.x, island.baseY - 18, island.z); // 初始由雲海下方升起

    const { baseGroup, hitMesh } = createFloatingIslandBase(island);
    islandRoot.add(baseGroup);
    islandRoot.add(hitMesh);
    islandPickMeshes.push(hitMesh);

    const contentGroup = new THREE.Group();
    if (island.isHub && buildHubScene) {
      buildHubScene(contentGroup, { island, registerAnim, registerCritter });
    } else if (!island.isHub && buildShopScene) {
      buildShopScene(contentGroup, { island, registerAnim, registerCritter });
    }
    islandRoot.add(contentGroup);

    // 關鍵效能技術：將整座浮島（底座 + 建築 + 餐點 + 樹木）所有靜態零件合併為極少數 BufferGeometry
    bakeStaticGroup(islandRoot, metrics);

    scene.add(islandRoot);
    islandEntries.push({
      island,
      index: idx,
      root: islandRoot,
      phase: idx * 0.85,
      hoverLift: 0,
      introProgress: 0,
      labelHeight: island.isHub ? 6.2 : 3.55
    });
  });

  // 空中拱橋與雲朵單車航道（同樣執行同材質靜態合併）
  const bridgesGroup = createSkyBridgesGroup(dataset.hub, dataset.shops);
  bakeStaticGroup(bridgesGroup, metrics);
  scene.add(bridgesGroup);

  // 全場天空動態裝飾（多層雲海、往返單車與步行小人、青花菜熱氣球、胡蘿蔔飛船、飛鳥）
  const skyDecorGroup = new THREE.Group();
  if (buildSkyDecor) {
    buildSkyDecor(skyDecorGroup, { dataset, registerAnim, registerCritter });
  }
  scene.add(skyDecorGroup);

  // 多層次低多邊形雲海（浮島下方雲海營造「天空之城」懸浮高度感 + 高空漂浮雲朵）
  const cloudClusters = [];
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.95,
    transparent: true,
    opacity: 0.9,
    flatShading: true
  });
  for (let i = 0; i < 18; i++) {
    const isUnderSea = i < 11;
    const cg = new THREE.Group();
    const puffs = isUnderSea
      ? [[0, 0, 0, 2.3], [1.9, -0.25, 0.3, 1.6], [-1.8, -0.3, -0.2, 1.7], [0.5, 0.55, 0.2, 1.45]]
      : [[0, 0, 0, 1.5], [1.3, -0.2, 0.2, 1.05], [-1.2, -0.25, -0.1, 1.1]];
    for (const [px, py, pz, pr] of puffs) {
      cg.add(makeIco(pr, '#ffffff', { detail: 1, material: cloudMat, pos: [px, py, pz], scale: [1.25, 0.72, 1.05], castShadow: false, receiveShadow: false }));
    }
    bakeStaticGroup(cg, metrics);
    const orbitR = isUnderSea ? 10 + (i * 13) % 34 : 28 + (i * 17) % 24;
    const orbitY = isUnderSea ? -5.8 - (i % 4) * 1.15 : 12.5 + (i % 4) * 1.6;
    const scale = isUnderSea ? 1.15 + (i % 3) * 0.3 : 0.85 + (i % 3) * 0.2;
    cg.scale.setScalar(scale);
    scene.add(cg);
    cloudClusters.push({ group: cg, r: orbitR, y: orbitY, angle: i * 1.37, speed: (isUnderSea ? 0.011 : 0.016) * (i % 2 === 0 ? 1 : -0.8) });
  }

  // 覓食航線動態虛線 (對標參考站「跨域串聯」)
  const linksGroup = new THREE.Group();
  linksGroup.visible = false;
  const linkAnchors = [];
  const dashMats = [];
  skyLinks.forEach(link => {
    const a = dataset.byId[link.from];
    const b = dataset.byId[link.to];
    if (!a || !b) return;
    const p1 = new THREE.Vector3(a.x, a.baseY + 1.1, a.z);
    const p2 = new THREE.Vector3(b.x, b.baseY + 1.1, b.z);
    const mid = new THREE.Vector3((a.x + b.x) * 0.5, Math.max(a.baseY, b.baseY) + 4.4, (a.z + b.z) * 0.5);
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const pts = curve.getPoints(30);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineDashedMaterial({
      color: b.ring === 'outer' ? '#ea7a2e' : '#356e6a',
      dashSize: 0.75,
      gapSize: 0.42
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    linksGroup.add(line);
    dashMats.push(lineMat);
    linkAnchors.push({ label: link.label, pos: mid.clone() });
  });
  scene.add(linksGroup);

  // 新竹雨天粒子特效 (當即時天氣為雨天時自動啟用)
  const RAIN_COUNT = 900;
  const rainPositions = new Float32Array(RAIN_COUNT * 6);
  const rainSpeeds = new Float32Array(RAIN_COUNT);
  for (let i = 0; i < RAIN_COUNT; i++) {
    const rx = (Math.random() - 0.5) * 76;
    const ry = Math.random() * 28 - 4;
    const rz = (Math.random() - 0.5) * 76;
    rainPositions.set([rx, ry, rz, rx + 0.08, ry - 0.65, rz], i * 6);
    rainSpeeds[i] = 15 + Math.random() * 7;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainLines = new THREE.LineSegments(
    rainGeo,
    new THREE.LineBasicMaterial({ color: '#dceef2', transparent: true, opacity: 0.5 })
  );
  rainLines.visible = false;
  scene.add(rainLines);

  // ==========================================================================
  // 狀態、相機平滑飛行與互動拾取
  // ==========================================================================
  const state = {
    selectedId: null,
    hoveredId: null,
    viewMode: 'panorama',
    timeMode: 'auto',
    weatherKind: 'clear',
    animate: true,
    showLinks: false,
    tourActive: false,
    activeBubble: null // { worldPos: Vector3, text: string, until: number }
  };

  const camFlight = {
    active: false,
    goalPos: new THREE.Vector3(0, 34, 48),
    goalTarget: new THREE.Vector3(0, 0.8, 1.5),
    speed: 4.2
  };

  function computeOverviewPose(mode = 'panorama') {
    const w = container.clientWidth || 1280;
    const h = container.clientHeight || 800;
    const aspect = w / h;
    const mobile = w <= 760;
    if (mode === 'bird') {
      const dist = aspect < 1 ? 82 : 66;
      return {
        pos: new THREE.Vector3(0, dist, 0.8),
        target: new THREE.Vector3(0, 0.5, 0.4)
      };
    }
    const dist = aspect < 0.8 ? 86 : mobile ? 74 : 72;
    const elevDeg = mobile ? 44 : 39;
    const rad = (elevDeg * Math.PI) / 180;
    return {
      pos: new THREE.Vector3(0, Math.sin(rad) * dist, Math.cos(rad) * dist + 1.5),
      target: new THREE.Vector3(-1.4, 0.5, 0.4)
    };
  }

  function flyToIsland(islandId, opts = {}) {
    state.selectedId = islandId;
    if (!islandId) {
      const pose = computeOverviewPose(state.viewMode === 'bird' ? 'bird' : 'panorama');
      camFlight.goalPos.copy(pose.pos);
      camFlight.goalTarget.copy(pose.target);
      camFlight.speed = 3.8;
      camFlight.active = true;
      return;
    }
    const targetIsland = dataset.byId[islandId];
    if (!targetIsland) return;

    const w = container.clientWidth || 1280;
    const mobile = w <= 760;
    const isHub = Boolean(targetIsland.isHub);
    const dist = isHub ? (mobile ? 19.5 : 17.5) : (mobile ? 14.5 : 12.8);
    const elev = isHub ? 0.52 : 0.56;

    // 讓相機從外圍或微偏角看向浮島，並為桌機右側面板 (430px) 或手機底部抽屜預留視覺偏移
    const baseAzimuth = isHub ? 0.24 : Math.atan2(targetIsland.x, targetIsland.z) * 0.25 + (opts.tourStep ? ((opts.tourStep % 3) - 1) * 0.28 : 0.22);
    const panelRightOffset = !mobile && !opts.noPanelOffset ? (isHub ? 2.4 : 1.85) : 0;
    const mobileSheetOffsetZ = mobile && !opts.noPanelOffset ? (isHub ? 2.2 : 1.7) : 0;

    const tx = targetIsland.x + Math.cos(baseAzimuth) * panelRightOffset;
    const ty = targetIsland.baseY + (isHub ? 1.9 : 1.15);
    const tz = targetIsland.z + mobileSheetOffsetZ;

    camFlight.goalTarget.set(tx, ty, tz);
    camFlight.goalPos.set(
      tx + Math.sin(baseAzimuth) * Math.cos(elev) * dist,
      ty + Math.sin(elev) * dist,
      tz + Math.cos(baseAzimuth) * Math.cos(elev) * dist
    );
    camFlight.speed = opts.tourStep !== undefined ? 2.6 : 4.4;
    camFlight.active = true;
  }

  // 使用者手動操作滑鼠或觸控旋轉時，立即釋放相機自動飛行鎖定，保證操控零搶奪
  controls.addEventListener('start', () => {
    camFlight.active = false;
  });

  // WASD 與方向鍵漫遊
  const onKeyDown = e => {
    if (e.target?.closest?.('input, textarea, select')) return;
    const step = 2.2;
    const k = e.key.toLowerCase();
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    let delta = null;
    if (k === 'w' || k === 'arrowup') delta = forward.multiplyScalar(step);
    else if (k === 's' || k === 'arrowdown') delta = forward.multiplyScalar(-step);
    else if (k === 'd' || k === 'arrowright') delta = right.multiplyScalar(step);
    else if (k === 'a' || k === 'arrowleft') delta = right.multiplyScalar(-step);

    if (delta) {
      e.preventDefault();
      camFlight.active = false;
      camera.position.add(delta);
      controls.target.add(delta);
    }
  };
  window.addEventListener('keydown', onKeyDown);

  // Raycaster 滑鼠懸停與點擊（僅檢測極精簡之 11 座浮島包圍體 + 小動物彩蛋碰撞球）
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDownPos = { x: 0, y: 0 };

  function updatePointer(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  renderer.domElement.addEventListener('pointermove', e => {
    updatePointer(e.clientX, e.clientY);
    raycaster.setFromCamera(pointer, camera);

    const critterHit = raycaster.intersectObjects(critterPickMeshes, false)[0];
    if (critterHit) {
      renderer.domElement.style.cursor = 'pointer';
      return;
    }
    const islandHit = raycaster.intersectObjects(islandPickMeshes, false)[0];
    const hid = islandHit ? islandHit.object.userData.islandId : null;
    if (hid !== state.hoveredId) {
      state.hoveredId = hid;
      renderer.domElement.style.cursor = hid ? 'pointer' : '';
      onHoverIsland?.(hid);
    }
  });

  renderer.domElement.addEventListener('pointerdown', e => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('pointerup', e => {
    if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 6) return;
    updatePointer(e.clientX, e.clientY);
    raycaster.setFromCamera(pointer, camera);

    // 優先檢測松鼠與蔬食小精靈彩蛋
    const critterHit = raycaster.intersectObjects(critterPickMeshes, false)[0];
    if (critterHit) {
      const meta = critterHit.object.userData.critterMeta;
      meta?.onHop?.();
      const worldPos = new THREE.Vector3();
      critterHit.object.getWorldPosition(worldPos);
      worldPos.y += 0.85;
      state.activeBubble = { worldPos, text: meta.speech, until: performance.now() + 2200 };
      onClickCritter?.(meta);
      return;
    }

    const islandHit = raycaster.intersectObjects(islandPickMeshes, false)[0];
    if (islandHit) {
      const id = islandHit.object.userData.islandId;
      flyToIsland(id);
      onSelectIsland?.(id);
    }
  });

  // 初始全景飛行定位
  const initPose = computeOverviewPose('panorama');
  camera.position.copy(initPose.pos);
  controls.target.copy(initPose.target);

  // 光影平滑插值器
  const curColors = {
    bg: new THREE.Color(SKY_PALETTES.day.bg),
    fog: new THREE.Color(SKY_PALETTES.day.fog),
    sun: new THREE.Color(SKY_PALETTES.day.sun),
    hemiSky: new THREE.Color(SKY_PALETTES.day.hemiSky),
    hemiGround: new THREE.Color(SKY_PALETTES.day.hemiGround),
    sunI: SKY_PALETTES.day.sunI,
    hemiI: SKY_PALETTES.day.hemiI,
    glow: SKY_PALETTES.day.glow
  };

  // 2D 座標投影緩存向量
  const projVec = new THREE.Vector3();
  function projectToScreen(worldX, worldY, worldZ, width, height) {
    projVec.set(worldX, worldY, worldZ).project(camera);
    if (projVec.z > 1) return null;
    return {
      x: (projVec.x * 0.5 + 0.5) * width,
      y: (-projVec.y * 0.5 + 0.5) * height
    };
  }

  // 主動畫渲染迴圈
  const clock = new THREE.Clock();
  let rafId = 0;

  function tick() {
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    // 1. 光影與天氣色溫平滑過渡
    const phase = resolveTimePhase(state.timeMode);
    const targetPal = SKY_PALETTES[phase];
    const isRainy = state.weatherKind === 'rain' || state.weatherKind === 'storm';
    const lerpK = Math.min(1, dt * 2.4);

    curColors.bg.lerp(new THREE.Color(isRainy && phase === 'day' ? '#8eaab0' : targetPal.bg), lerpK);
    curColors.fog.lerp(new THREE.Color(isRainy && phase === 'day' ? '#a6bec2' : targetPal.fog), lerpK);
    curColors.sun.lerp(new THREE.Color(targetPal.sun), lerpK);
    curColors.hemiSky.lerp(new THREE.Color(targetPal.hemiSky), lerpK);
    curColors.hemiGround.lerp(new THREE.Color(targetPal.hemiGround), lerpK);
    curColors.sunI += ((isRainy ? targetPal.sunI * 0.72 : targetPal.sunI) - curColors.sunI) * lerpK;
    curColors.hemiI += (targetPal.hemiI - curColors.hemiI) * lerpK;
    curColors.glow += (targetPal.glow - curColors.glow) * lerpK;

    scene.background.copy(curColors.bg);
    scene.fog.color.copy(curColors.fog);
    dirLight.color.copy(curColors.sun);
    dirLight.intensity = curColors.sunI;
    hemiLight.color.copy(curColors.hemiSky);
    hemiLight.groundColor.copy(curColors.hemiGround);
    hemiLight.intensity = curColors.hemiI;
    glowWindowMat.emissiveIntensity = curColors.glow;
    glowJadeMat.emissiveIntensity = 0.42 + Math.sin(elapsed * 2.2) * 0.18 + curColors.glow * 0.25;
    for (const item of glowSignMaterials) {
      item.material.emissiveIntensity = item.isLed ? Math.min(2.5, curColors.glow * 1.15) : curColors.glow * 0.75;
    }
    cloudMat.color.set(phase === 'night' ? '#5e7c8c' : phase === 'dusk' ? '#ffe0c8' : isRainy ? '#cfd8dc' : '#ffffff');

    // 2. 11 座天空之城浮島：進場升起 + 懸浮呼吸 + Hover/Select 平滑抬升
    for (const entry of islandEntries) {
      const introT = Math.min(1, Math.max(0, (elapsed - 0.15 - entry.index * 0.08) / 0.85));
      const easeOut = 1 - Math.pow(1 - introT, 3);
      entry.introProgress = easeOut;

      const isSelected = state.selectedId === entry.island.id;
      const isHovered = state.hoveredId === entry.island.id;
      const targetLift = isSelected ? 0.48 : isHovered ? 0.28 : 0;
      entry.hoverLift += (targetLift - entry.hoverLift) * Math.min(1, dt * 8);

      const bob = state.animate ? Math.sin(elapsed * 1.15 + entry.phase) * 0.14 : 0;
      entry.root.position.y = entry.island.baseY - (1 - easeOut) * 18 + bob + entry.hoverLift;
    }

    // 3. 雲海與動態角色更新
    if (state.animate) {
      for (const c of cloudClusters) {
        c.angle += dt * c.speed;
        c.group.position.set(Math.cos(c.angle) * c.r, c.y, Math.sin(c.angle) * c.r);
        c.group.rotation.y = -c.angle;
      }
      for (const fn of animCallbacks) fn(elapsed, dt);

      if (linksGroup.visible) {
        for (const dm of dashMats) dm.dashOffset = (dm.dashOffset || 0) - dt * 0.9;
      }
    }

    // 雨天粒子更新
    rainLines.visible = isRainy;
    if (isRainy && state.animate) {
      const arr = rainGeo.attributes.position.array;
      for (let i = 0; i < RAIN_COUNT; i++) {
        let y = arr[i * 6 + 1] - rainSpeeds[i] * dt;
        if (y < -6) y += 30;
        arr[i * 6 + 1] = y;
        arr[i * 6 + 4] = y - 0.65;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    // 4. 相機平滑飛行與導覽微幅環繞
    if (camFlight.active) {
      const k = 1 - Math.exp(-camFlight.speed * dt);
      camera.position.lerp(camFlight.goalPos, k);
      controls.target.lerp(camFlight.goalTarget, k);
      if (camera.position.distanceTo(camFlight.goalPos) < 0.04 && controls.target.distanceTo(camFlight.goalTarget) < 0.04) {
        camera.position.copy(camFlight.goalPos);
        controls.target.copy(camFlight.goalTarget);
        camFlight.active = false;
      }
    } else if (state.tourActive && state.animate) {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, dt * 0.11);
      camera.position.copy(controls.target).add(offset);
    }

    controls.update();

    // 5. 渲染畫面（桌機預設走 Tilt-Shift 微縮後製管線；手機或關閉特效時直出省電）
    renderer.info.autoReset = false;
    renderer.info.reset();
    if (metrics.fxEnabled && composer) {
      composer.render(dt);
    } else {
      renderer.render(scene, camera);
    }

    metrics.drawCalls = renderer.info.render.calls;
    metrics.triangles = renderer.info.render.triangles;

    // 6. 同步 2D 浮島名牌、航線標籤與松鼠對話氣泡螢幕座標
    if (onFrameLabels) {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const islandCoords = {};
      for (const entry of islandEntries) {
        if (entry.introProgress < 0.85) continue;
        const steadyY = entry.island.baseY - (1 - entry.introProgress) * 18 + entry.hoverLift + entry.labelHeight;
        islandCoords[entry.island.id] = projectToScreen(
          entry.root.position.x,
          steadyY,
          entry.root.position.z,
          w,
          h
        );
      }
      const linkCoords = linksGroup.visible
        ? linkAnchors.map(a => ({ label: a.label, screen: projectToScreen(a.pos.x, a.pos.y, a.pos.z, w, h) }))
        : [];
      let bubble = null;
      if (state.activeBubble && performance.now() < state.activeBubble.until) {
        bubble = {
          text: state.activeBubble.text,
          screen: projectToScreen(state.activeBubble.worldPos.x, state.activeBubble.worldPos.y, state.activeBubble.worldPos.z, w, h)
        };
      } else {
        state.activeBubble = null;
      }
      onFrameLabels({ islandCoords, linkCoords, bubble });
    }
  }

  tick();

  // 視窗縮放自適應
  const onResize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    camera.aspect = w / h;
    camera.fov = w / h < 0.85 ? 42 : 31;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) {
      composer.setSize(w, h);
      if (tiltPass) tiltPass.uniforms.uAspect.value = w / h;
    }
  };
  window.addEventListener('resize', onResize);

  return {
    metrics,
    flyToIsland,
    setViewMode(mode) {
      state.viewMode = mode;
      if (mode === 'panorama' || mode === 'bird') {
        state.selectedId = null;
        const pose = computeOverviewPose(mode);
        camFlight.goalPos.copy(pose.pos);
        camFlight.goalTarget.copy(pose.target);
        camFlight.speed = 3.8;
        camFlight.active = true;
      }
    },
    setTimeMode(mode) {
      state.timeMode = mode;
    },
    setWeatherKind(kind) {
      state.weatherKind = kind || 'clear';
    },
    setAnimate(flag) {
      state.animate = Boolean(flag);
    },
    setShowLinks(flag) {
      state.showLinks = Boolean(flag);
      linksGroup.visible = state.showLinks;
    },
    setTourActive(flag) {
      state.tourActive = Boolean(flag);
    },
    setFx(flag) {
      metrics.fxEnabled = Boolean(flag);
      if (metrics.fxEnabled) ensureComposer();
      return metrics.fxEnabled;
    },
    getFx() {
      return metrics.fxEnabled;
    },
    dispose() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      controls.dispose();
      renderer.dispose();
    }
  };
}
