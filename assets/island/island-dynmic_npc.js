/**
 * island-dynmic_npc.js - 2026 清大福青社蔬食浮島：常駐走動島民與跨島巡迴講師系統
 * 
 * 規格與效能承諾：
 * 1. 幾何複用與共用調色盤材質（3 節點極簡低多邊形：軀幹頭部 + 左右擺動雙腿 + 扁平假陰影）
 * 2. 嚴格木橋路徑導引：巡迴講師嚴格依照清華立柱主島與內環 5 島之間的木石拱橋拋物線行走，絕不跨越空中
 * 3. 裝置動態分級（Device Tiering）：
 *    - 桌機瀏覽 (寬度 > 768px)：每島 2~3 位常駐路人 (30 人) + 3 位跨島巡迴講師 = 共 33 人
 *    - 手持裝置 (寬度 <= 768px)：每島 1 位常駐路人 (11 人) + 1 位跨島巡迴講師 = 共 12 人
 * 4. 講師高辨識度外觀：深色風衣外套、知性眼鏡、手持專業講義夾，無額外互動與名牌遮蔽視線
 */

(function () {
  'use strict';

  // 共享幾何體快取池（大幅降低記憶體開銷與 GC 壓力）
  let geoHead = null;
  let geoHair = null;
  let geoTorso = null;
  let geoLeg = null;
  let geoArm = null;
  let geoCoat = null;
  let geoGlasses = null;
  let geoFolder = null;
  let geoShadow = null;

  // 共用材質快取字典
  const matCache = new Map();
  function getMat(color, opts = {}) {
    const key = `${color}_${opts.roughness || 0.6}_${opts.metalness || 0.1}_${opts.transparent ? 1 : 0}_${opts.opacity || 1}`;
    if (!matCache.has(key)) {
      const THREE = window.THREE;
      if (opts.basic) {
        matCache.set(key, new THREE.MeshBasicMaterial({ color, ...opts }));
      } else {
        matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
      }
    }
    return matCache.get(key);
  }

  function initGeometries(THREE) {
    if (geoHead) return;
    geoHead = new THREE.SphereGeometry(0.125, 8, 8);
    geoHair = new THREE.SphereGeometry(0.13, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
    geoTorso = new THREE.BoxGeometry(0.24, 0.28, 0.16);
    geoLeg = new THREE.BoxGeometry(0.08, 0.22, 0.09);
    geoArm = new THREE.BoxGeometry(0.065, 0.22, 0.075);
    geoCoat = new THREE.BoxGeometry(0.26, 0.32, 0.18);
    geoGlasses = new THREE.BoxGeometry(0.16, 0.025, 0.03);
    geoFolder = new THREE.BoxGeometry(0.025, 0.18, 0.13);
    geoShadow = new THREE.CircleGeometry(0.24, 12);
  }

  // 常駐路人服裝調色盤
  const SHIRT_COLORS = [
    '#ffffff', '#f5e6cc', '#a8dfc8', '#79c2a8', '#9ec5e8',
    '#f7c59f', '#e3b5e8', '#fad2e1', '#d8e2dc', '#ffe5d9'
  ];
  const PANTS_COLORS = [
    '#2b3a4a', '#3a4750', '#4f5d75', '#2d3142', '#6c757d', '#3d405b'
  ];
  const SKIN_COLORS = ['#fcdbb2', '#f5cba7', '#e0ab76', '#f8d7b8'];
  const HAIR_COLORS = ['#222222', '#3d2314', '#5c4033', '#1a1a1a', '#443322'];

  // 跨島巡迴講師設定（高辨識度造型與專屬主配色）
  const INSTRUCTOR_CONFIGS = [
    {
      id: 'inst-green',
      title: '蔬食營養健康教授',
      coatColor: '#152844', // 沉穩午夜海軍藍西裝
      shirtColor: '#38a3a5', // 湖水綠領襯衫
      pantsColor: '#2b2d42',
      folderColor: '#9c6644', // 經典牛皮講義夾
      scale: 0.98,
      speed: 0.52
    },
    {
      id: 'inst-burgundy',
      title: '綠色生態推廣講師',
      coatColor: '#6a1b29', // 典雅勃根地紅風衣
      shirtColor: '#f4a261', // 暖杏色內搭
      pantsColor: '#264653',
      folderColor: '#2a9d8f', // 翡翠綠公文夾
      scale: 0.96,
      speed: 0.48
    },
    {
      id: 'inst-forest',
      title: '永續生活倡導顧問',
      coatColor: '#283618', // 深邃森林綠長袍
      shirtColor: '#dda15e', // 暖褐領片
      pantsColor: '#333333',
      folderColor: '#bc6c25', // 焦糖色手提板
      scale: 0.97,
      speed: 0.50
    }
  ];

  /**
   * 建立單一低多邊形人物模型（3 節點階層＋地面貼片假陰影）
   */
  function createAvatarMesh(THREE, { isInstructor = false, instructorCfg = null, seed = 0 }) {
    initGeometries(THREE);

    const root = new THREE.Group();
    root.name = isInstructor ? 'InstructorAvatar' : 'PedestrianAvatar';

    // 1. 地面扁平烘焙假陰影（Blob Shadow）
    const shadowMat = getMat('#000000', { basic: true, transparent: true, opacity: 0.22 });
    const shadowMesh = new THREE.Mesh(geoShadow, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.015;
    root.add(shadowMesh);

    // 2. 主體人物群組
    const bodyGroup = new THREE.Group();
    const finalScale = isInstructor ? instructorCfg.scale : 0.88;
    bodyGroup.scale.setScalar(finalScale);
    root.add(bodyGroup);

    // 顏色選擇
    const skin = SKIN_COLORS[seed % SKIN_COLORS.length];
    const hair = HAIR_COLORS[(seed * 2) % HAIR_COLORS.length];
    const shirt = isInstructor ? instructorCfg.shirtColor : SHIRT_COLORS[seed % SHIRT_COLORS.length];
    const pants = isInstructor ? instructorCfg.pantsColor : PANTS_COLORS[seed % PANTS_COLORS.length];

    // 3. 左右腿（獨立旋轉軸節點）
    const legL = new THREE.Group();
    legL.position.set(-0.055, 0.22, 0);
    const meshLegL = new THREE.Mesh(geoLeg, getMat(pants));
    meshLegL.position.y = -0.11;
    legL.add(meshLegL);

    const legR = new THREE.Group();
    legR.position.set(0.055, 0.22, 0);
    const meshLegR = new THREE.Mesh(geoLeg, getMat(pants));
    meshLegR.position.y = -0.11;
    legR.add(meshLegR);

    bodyGroup.add(legL, legR);

    // 4. 軀幹與服裝
    const torsoMesh = new THREE.Mesh(geoTorso, getMat(shirt));
    torsoMesh.position.y = 0.36;
    bodyGroup.add(torsoMesh);

    // 若為講師：外層加套高辨識度長風衣外套、知性眼鏡、手持講義夾
    if (isInstructor) {
      const coatMesh = new THREE.Mesh(geoCoat, getMat(instructorCfg.coatColor));
      coatMesh.position.y = 0.36;
      bodyGroup.add(coatMesh);

      // 知性眼鏡
      const glassesMesh = new THREE.Mesh(geoGlasses, getMat('#111111'));
      glassesMesh.position.set(0, 0.58, 0.125);
      bodyGroup.add(glassesMesh);
    }

    // 5. 頭部與髮型
    const headMesh = new THREE.Mesh(geoHead, getMat(skin));
    headMesh.position.y = 0.58;
    bodyGroup.add(headMesh);

    const hairMesh = new THREE.Mesh(geoHair, getMat(hair));
    hairMesh.position.set(0, 0.61, -0.01);
    bodyGroup.add(hairMesh);

    // 6. 手臂
    const armL = new THREE.Group();
    armL.position.set(-0.145, 0.44, 0);
    const meshArmL = new THREE.Mesh(geoArm, getMat(isInstructor ? instructorCfg.coatColor : shirt));
    meshArmL.position.y = -0.11;
    armL.add(meshArmL);

    const armR = new THREE.Group();
    armR.position.set(0.145, 0.44, 0);
    const meshArmR = new THREE.Mesh(geoArm, getMat(isInstructor ? instructorCfg.coatColor : shirt));
    meshArmR.position.y = -0.11;
    armR.add(meshArmR);

    // 講師右手手持講義夾
    if (isInstructor) {
      armR.rotation.x = -0.38;
      const folderMesh = new THREE.Mesh(geoFolder, getMat(instructorCfg.folderColor));
      folderMesh.position.set(0.04, -0.16, 0.08);
      armR.add(folderMesh);
    }

    bodyGroup.add(armL, armR);

    return {
      root,
      bodyGroup,
      legL,
      legR,
      armL,
      armR,
      isInstructor
    };
  }

  /**
   * 計算清華主島與內環餐廳島之間的木石拱橋精確弧度節點
   */
  function buildBridgePoints(hub, shop, forward = true) {
    const hubEdge = (hub.islandRadius || 5.5) * Math.cos(Math.PI / 8) - 0.15;
    const shopEdge = (shop.islandRadius || 3.85) * Math.cos(Math.PI / 8) - 0.15;
    const dx = shop.x - hub.x;
    const dz = shop.z - hub.z;
    const totalDist = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const startR = hubEdge;
    const endR = totalDist - shopEdge;
    const span = endR - startR;
    const archH = 0.75; // 與 island-world.js 木橋拱高完全吻合

    const pts = [];
    const count = 14;
    for (let i = 0; i <= count; i++) {
      const t = forward ? (i / count) : (1 - i / count);
      const r = startR + t * span;
      // 腳掌穩健貼合木橋板面（木橋表面 + 踏板厚度 + 0.045 安全淨空）
      const y = hub.baseY * (1 - t) + shop.baseY * t + 0.06 + Math.sin(t * Math.PI) * archH + 0.045;
      const x = hub.x + Math.cos(angle) * r;
      const z = hub.z + Math.sin(angle) * r;
      pts.push([x, y, z]);
    }
    return pts;
  }

  /**
   * 產生常駐路人在島嶼綠地廣場的安全巡迴路徑
   * 座標統一為島嶼本地 (Local) 座標系，依附於各自的 islandRoot，草坪基準面為 y = 0.045
   */
  function buildIslandWanderRoutes(island, isHub = false) {
    const routes = [];
    if (isHub) {
      // 清華主島（半徑 5.5，圍繞簡冊立柱與林蔭散步道）
      routes.push([
        [1.8, 0.045, 1.4],
        [2.6, 0.045, -0.6],
        [1.2, 0.045, -2.4],
        [-1.6, 0.045, -2.1],
        [-2.5, 0.045, 0.2],
        [-1.4, 0.045, 2.2],
        [0.4, 0.045, 2.5]
      ]);
      routes.push([
        [-1.8, 0.045, 1.2],
        [-2.6, 0.045, -1.2],
        [-0.8, 0.045, -2.6],
        [1.5, 0.045, -1.8],
        [2.4, 0.045, 0.4],
        [1.2, 0.045, 2.2],
        [-0.4, 0.045, 2.4]
      ]);
      routes.push([
        [0.0, 0.045, 2.2],
        [1.4, 0.045, 1.6],
        [1.9, 0.045, 0.2],
        [0.8, 0.045, -1.2],
        [-1.0, 0.045, -1.2],
        [-1.8, 0.045, 0.4],
        [-1.2, 0.045, 1.8]
      ]);
    } else {
      // 10 座餐廳島（避開後方建築建物，於前半部前庭、露天花園、景觀台漫步，本地座標系）
      routes.push([
        [-1.1, 0.045, 1.1],
        [-0.3, 0.045, 1.8],
        [0.8, 0.045, 1.6],
        [1.3, 0.045, 0.9],
        [0.2, 0.045, 0.7]
      ]);
      routes.push([
        [1.2, 0.045, 1.2],
        [0.4, 0.045, 2.0],
        [-0.8, 0.045, 1.7],
        [-1.3, 0.045, 0.9],
        [-0.2, 0.045, 0.8]
      ]);
      routes.push([
        [-0.7, 0.045, 1.9],
        [0.5, 0.045, 1.8],
        [1.2, 0.045, 1.1],
        [0.6, 0.045, 1.3],
        [-0.4, 0.045, 1.5]
      ]);
    }
    return routes;
  }

  /**
   * 產生跨島巡迴講師的完整閉環路徑（嚴格走木橋，跨越主島與內環島嶼）
   */
  function buildInstructorCircuit(hub, innerShops, shopSequence) {
    const fullPath = [];

    // 主島中心集合點
    const hubCenter = [hub.x, hub.baseY + 0.045, hub.z];

    for (let sIdx = 0; sIdx < shopSequence.length; sIdx++) {
      const shop = innerShops[shopSequence[sIdx]];
      if (!shop) continue;

      // 1. 從主島綠地步行至該座木橋橋頭
      const bridgeOut = buildBridgePoints(hub, shop, true);
      const bridgeIn = buildBridgePoints(hub, shop, false);

      const hubBridgeHead = bridgeOut[0];
      fullPath.push([
        hubCenter[0] * 0.4 + hubBridgeHead[0] * 0.6,
        hub.baseY + 0.045,
        hubCenter[2] * 0.4 + hubBridgeHead[2] * 0.6
      ]);

      // 2. 嚴格踏著木橋拱形踏板走向餐廳島（14 個橋樑點）
      for (const pt of bridgeOut) {
        fullPath.push(pt);
      }

      // 3. 踏上餐廳島前庭廣場視察（3 個安全節點）
      const sx = shop.x;
      const sy = shop.baseY + 0.045;
      const sz = shop.z;
      fullPath.push([sx + 0.4, sy, sz + 0.9]);
      fullPath.push([sx - 0.5, sy, sz + 1.4]);
      fullPath.push([sx + 0.2, sy, sz + 1.2]);

      // 4. 踏著木橋走回清華主島（14 個橋樑點）
      for (const pt of bridgeIn) {
        fullPath.push(pt);
      }

      // 5. 穿過主島綠地散步道邁向下一座橋
      fullPath.push(hubCenter);
    }

    return fullPath;
  }

  /**
   * 路徑巡航控制實體
   */
  class DynamicWalker {
    constructor(avatar, path, speed = 0.45, startProgress = 0, opts = {}) {
      this.avatar = avatar;
      this.path = path;
      this.speed = speed;
      this.islandRoots = opts.islandRoots || null;
      this.hub = opts.hub || null;
      this.innerShops = opts.innerShops || null;
      this.totalDist = 0;
      this.segDists = [];
      this.segCumulative = [0];

      // 計算各線段長度與總長
      for (let i = 0; i < path.length; i++) {
        const a = path[i];
        const b = path[(i + 1) % path.length];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        this.segDists.push(d);
        this.totalDist += d;
        this.segCumulative.push(this.totalDist);
      }

      this.currentDist = (startProgress * this.totalDist) % this.totalDist;
      this.walkPhase = startProgress * Math.PI * 4;
    }

    update(dt) {
      if (this.totalDist <= 0) return;

      this.currentDist = (this.currentDist + dt * this.speed) % this.totalDist;
      this.walkPhase += dt * this.speed * 12.0;

      // 尋找當前線段
      let segIdx = 0;
      while (segIdx < this.segDists.length - 1 && this.currentDist >= this.segCumulative[segIdx + 1]) {
        segIdx++;
      }

      const segStart = this.segCumulative[segIdx];
      const segLen = Math.max(0.001, this.segDists[segIdx]);
      const t = (this.currentDist - segStart) / segLen;

      const p0 = this.path[segIdx];
      const p1 = this.path[(segIdx + 1) % this.path.length];

      // 座標線性插值
      const curX = p0[0] + (p1[0] - p0[0]) * t;
      let curY = p0[1] + (p1[1] - p0[1]) * t;
      const curZ = p0[2] + (p1[2] - p0[2]) * t;

      // 若為跨島講師（世界座標系巡航），於接近島嶼腹地時動態貼合該島即時懸浮起伏 (bob + hoverLift)
      if (this.avatar.isInstructor && this.islandRoots) {
        const hubRoot = this.islandRoots.get('nthu-hub');
        const dHub = Math.hypot(curX - this.hub.x, curZ - this.hub.z);
        if (dHub < 5.2 && hubRoot) {
          const hubOffset = hubRoot.position.y - this.hub.baseY;
          const blend = Math.max(0, Math.min(1, (5.2 - dHub) / 1.5));
          curY += hubOffset * blend;
        } else if (this.innerShops) {
          for (let s = 0; s < this.innerShops.length; s++) {
            const sh = this.innerShops[s];
            const dShop = Math.hypot(curX - sh.x, curZ - sh.z);
            if (dShop < 3.6) {
              const shopRoot = this.islandRoots.get(sh.id);
              if (shopRoot) {
                const shopOffset = shopRoot.position.y - sh.baseY;
                const blend = Math.max(0, Math.min(1, (3.6 - dShop) / 1.2));
                curY += shopOffset * blend;
              }
              break;
            }
          }
        }
      }

      this.avatar.root.position.set(curX, curY, curZ);

      // 移動朝向旋轉
      const dx = p1[0] - p0[0];
      const dz = p1[2] - p0[2];
      if (Math.hypot(dx, dz) > 0.01) {
        const targetRotY = Math.atan2(dx, dz);
        // 平滑轉向插值
        let curRotY = this.avatar.root.rotation.y;
        let diff = (targetRotY - curRotY) % (Math.PI * 2);
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        this.avatar.root.rotation.y += diff * Math.min(1, dt * 8);
      }

      // 雙腿自然交叉擺動
      const swing = Math.sin(this.walkPhase) * 0.48;
      this.avatar.legL.rotation.x = swing;
      this.avatar.legR.rotation.x = -swing;

      // 雙臂自然對角擺動
      const armSwing = Math.sin(this.walkPhase) * 0.42;
      this.avatar.armL.rotation.x = -armSwing;
      if (this.avatar.isInstructor) {
        // 講師手持公文夾微擺
        this.avatar.armR.rotation.x = -0.38 + armSwing * 0.18;
      } else {
        this.avatar.armR.rotation.x = armSwing;
      }

      // 身體輕微起伏（步伐跨越時自然上升，最低點恆為 0 確保鞋底不穿模）
      this.avatar.bodyGroup.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.024;
    }

    destroy() {
      if (this.avatar && this.avatar.root && this.avatar.root.parent) {
        this.avatar.root.parent.remove(this.avatar.root);
      }
    }
  }

  // 動態 NPC 系統管理器
  class DynamicNPCManager {
    constructor() {
      this.scene = null;
      this.dataset = null;
      this.THREE = null;
      this.walkers = [];
      this.isMobile = window.innerWidth <= 768;
      this.isRunning = false;
      this.lastTime = 0;
      this.npcContainer = null;
      this.islandRoots = new Map();
    }

    init({ scene, dataset, THREE }) {
      this.scene = scene;
      this.dataset = dataset;
      this.THREE = THREE || window.THREE;
      if (!this.scene || !this.dataset || !this.THREE) {
        console.warn('[island-dynmic_npc] 初始化參數不齊全，稍後重試');
        return false;
      }

      // 建立全域講師與容器群組
      this.npcContainer = new this.THREE.Group();
      this.npcContainer.name = 'DynamicNPCGroup';
      this.scene.add(this.npcContainer);

      // 遍歷檢索場景中所有浮島根節點 (islandRoots)
      this.islandRoots.clear();
      this.scene.traverse(obj => {
        if (obj.userData && obj.userData.islandId) {
          this.islandRoots.set(obj.userData.islandId, obj.parent);
        }
      });

      this.buildNPCs();

      // 啟動專屬輕量動畫循環（嚴格受全站「動態」開關即時控制）
      this.isRunning = true;
      this.lastTime = performance.now();

      const isAnimActive = () => {
        if (window.__ISLAND_APP__?.uiState?.animate !== undefined) {
          return window.__ISLAND_APP__.uiState.animate;
        }
        const btn = document.querySelector('[data-toggle="anim"]');
        if (btn) return btn.classList.contains('on');
        return true;
      };

      const loop = (now) => {
        if (!this.isRunning) return;

        // 當使用者切換關閉「動態」時，漫遊小人立即暫停動作
        const isAnim = isAnimActive();
        if (!isAnim) {
          this.lastTime = now; // 保持時間基準不跳耀
          requestAnimationFrame(loop);
          return;
        }

        const dt = Math.min(0.06, (now - this.lastTime) / 1000);
        this.lastTime = now;
        for (let i = 0; i < this.walkers.length; i++) {
          this.walkers[i].update(dt);
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      // 監聽螢幕寬度切換，自適應調整人數規模
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const currentIsMobile = window.innerWidth <= 768;
          if (currentIsMobile !== this.isMobile) {
            this.isMobile = currentIsMobile;
            this.rebuildNPCs();
          }
        }, 300);
      });

      console.info(
        `[island-dynmic_npc] 動態 NPC 系統啟動成功！模式：${this.isMobile ? '手持裝置 (12人)' : '桌機全景 (33人)'}`
      );
      return true;
    }

    clearWalkers() {
      for (const w of this.walkers) {
        w.destroy();
      }
      this.walkers = [];
    }

    rebuildNPCs() {
      this.clearWalkers();
      this.buildNPCs();
    }

    buildNPCs() {
      const THREE = this.THREE;
      const hub = this.dataset.hub;
      const allShops = this.dataset.shops || [];
      const innerShops = allShops.filter(s => s.ring === 'inner');
      const allIslands = [hub, ...allShops];

      let seedCounter = 1;

      // ==========================================
      // 1. 常駐走動路人配置 (Resident Pedestrians)
      // 依島嶼 islandRoot 本地座標系掛載，徹底杜絕懸浮與沉入土地
      // ==========================================
      allIslands.forEach((island, islIdx) => {
        const isHub = Boolean(island.isHub);
        const routes = buildIslandWanderRoutes(island, isHub);
        const islandRoot = this.islandRoots?.get(island.id);

        let parentGroup = this.npcContainer;
        if (islandRoot) {
          let sub = islandRoot.getObjectByName('DynamicResidentNPCs');
          if (!sub) {
            sub = new THREE.Group();
            sub.name = 'DynamicResidentNPCs';
            islandRoot.add(sub);
          }
          parentGroup = sub;
        }

        // 裝置人數分級：
        // 手持裝置：每島 1 位 (共 11 位)
        // 桌機環境：每島 2~3 位 (共 30 位)
        let countForIsland = 1;
        if (!this.isMobile) {
          // 桌機模式：每島 2~3 位，共 30 位常駐路人（8 島 × 3 人 + 3 島 × 2 人 = 30 人，加上 3 位講師共 33 人）
          countForIsland = (islIdx === 2 || islIdx === 4 || islIdx === 6) ? 2 : 3;
        }

        for (let i = 0; i < countForIsland; i++) {
          const route = routes[i % routes.length];
          const seed = seedCounter++;
          const avatar = createAvatarMesh(THREE, { isInstructor: false, seed });
          const speed = 0.38 + (seed % 5) * 0.05;
          const startProgress = (i * 0.33 + (islIdx * 0.17)) % 1.0;

          const walker = new DynamicWalker(avatar, route, speed, startProgress);
          parentGroup.add(avatar.root);
          this.walkers.push(walker);
        }
      });

      // ==========================================
      // 2. 跨島巡迴講師配置 (Touring Instructors)
      // 跨越木橋與多島，掛載於場景全域容器，動態貼合橋面與島嶼起伏
      // ==========================================
      if (this.isMobile) {
        // 手持裝置：1 位巡迴講師（走遍內環 5 家餐廳島與主島的木橋網絡）
        const instructorCfg = INSTRUCTOR_CONFIGS[0];
        const sequence = [0, 1, 2, 3, 4]; // 依序巡訪雅素齋、妙觀音、安姆士、棗子樹、鼎盛蔬食
        const circuit = buildInstructorCircuit(hub, innerShops, sequence);

        const avatar = createAvatarMesh(THREE, { isInstructor: true, instructorCfg, seed: 99 });
        const walker = new DynamicWalker(avatar, circuit, instructorCfg.speed, 0.0, {
          islandRoots: this.islandRoots,
          hub,
          innerShops
        });
        this.npcContainer.add(avatar.root);
        this.walkers.push(walker);
      } else {
        // 桌機環境：3 位高辨識度巡迴講師（分工巡視不同木橋區間，保持各島生動活力）
        const assignments = [
          { cfg: INSTRUCTOR_CONFIGS[0], seq: [0, 1], start: 0.05 }, // 雅素齋與妙觀音木橋
          { cfg: INSTRUCTOR_CONFIGS[1], seq: [2, 3], start: 0.38 }, // 安姆士與棗子樹木橋
          { cfg: INSTRUCTOR_CONFIGS[2], seq: [4, 0], start: 0.72 }  // 鼎盛蔬食與雅素齋木橋
        ];

        assignments.forEach(({ cfg, seq, start }, idx) => {
          const circuit = buildInstructorCircuit(hub, innerShops, seq);
          const avatar = createAvatarMesh(THREE, { isInstructor: true, instructorCfg: cfg, seed: 100 + idx });
          const walker = new DynamicWalker(avatar, circuit, cfg.speed, start, {
            islandRoots: this.islandRoots,
            hub,
            innerShops
          });
          this.npcContainer.add(avatar.root);
          this.walkers.push(walker);
        });
      }
    }

    getStats() {
      const instructors = this.walkers.filter(w => w.avatar.isInstructor).length;
      const pedestrians = this.walkers.length - instructors;
      return {
        isMobile: this.isMobile,
        totalNPCs: this.walkers.length,
        pedestrians,
        instructors
      };
    }
  }

  // 建立全域單例
  const dynamicNPCManager = new DynamicNPCManager();
  window.__DYNAMIC_NPC_SYSTEM__ = dynamicNPCManager;

  // 自主偵測掛載機制（解耦獨立，不侵入修改既有腳本）
  function tryAutoBootstrap() {
    if (window.__islandScene && window.__ISLAND_APP__ && window.__ISLAND_APP__.dataset) {
      let hasIslands = false;
      window.__islandScene.traverse(obj => {
        if (obj.userData && obj.userData.islandId) hasIslands = true;
      });
      if (!hasIslands) return false;

      dynamicNPCManager.init({
        scene: window.__islandScene,
        dataset: window.__ISLAND_APP__.dataset,
        THREE: window.THREE
      });
      return true;
    }
    return false;
  }

  // 嘗試多次自檢，直至 3D 天空之城場景就緒
  if (!tryAutoBootstrap()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryAutoBootstrap() || attempts > 60) {
        clearInterval(interval);
      }
    }, 200);
  }

})();
