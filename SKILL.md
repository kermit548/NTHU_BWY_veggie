---
name: K06-island-for-Gemini
description: 全域 3D 互動群島與空間隱喻微縮網站建設技能包（適用於 Windows 11 + Google AntiGravity 環境）。萃取自「南大附中探索群島」技術架構、「2026/10/28 3D 互動校園與教育應用」創意矩陣與「2026 清大福青社天空之城蔬食地圖」24 階段實戰調優經驗。啟動時強制先以三個引導問題確認：（1）內容主題、（2）12 種 3D 視覺風格或自訂、（3）包含「群島」在內之 15 種空間比喻模型或自訂；確認需求後先產出實作計畫供使用者驗證，並於每完成一個階段即時更新專案紀錄檔（含雙位數流水號、階段與項目名稱、忠實原始提示詞及跨模型接手快照），確保 Token 耗盡時其他模型可無縫接手。當使用者要求「做一個 3D 群島網站」、「建立天空之城浮島地圖」、「用島嶼技能建置網站」、「製作 3D 微縮導覽互動網站」或呼叫 K06-island-for-Gemini 時載入。
---

# K06-island-for-Gemini：3D 互動群島與空間隱喻微縮網站建設技能包

本技能將平面資料（TSV / CSV / JSON / 試算表 / PDF / 官網資訊）轉譯為**純程式碼幾何構建、幾十 KB 極速秒開、支援移軸微縮視覺與跨裝置流暢互動**的 3D 主題探索網站，並內建**防 Token 斷鏈之跨模型階段檢查點機制**。

---

## 一、 啟動鐵律：三問定錨工作流（Phase 1 — 嚴禁未問先寫程式）

當使用者觸發本技能且尚未完整指定以下三項參數時，**嚴禁直接撰寫任何前端或 3D 程式碼**。必須先讀取 [references/creative-catalog.md](./references/creative-catalog.md)，向使用者呈現清晰選項並透過以下**三個引導問題**確認專案目標（可搭配 `ask_question` 工具或結構化編號清單供使用者點選／填寫）：

### 問題 1：確認內容主題與資料來源
詢問使用者本次網站的核心內容主題與現有素材：
- **常見主題範例**：
  1. 學校科系／專門學程／社團博覽會介紹
  2. 自身興趣分類／個人作品集／知識圖譜策展
  3. 周邊店家導覽／美食散步地圖／活動集章專題
  4. 校園新生報到／防災演練／學科科學微縮模型
- **同步確認素材**：是否已有現成資料檔（TSV / CSV / Excel / PDF / 圖片色票）？中央核心主地標預計放什麼象徵物（例如校門立柱、吉祥物雕像、核心恆星、知識神木）？若使用者提供 PDF / Word / Excel 原始檔，優先委派 `markitdown` 技能轉為結構化文本再解析，不重複造輪子。

### 問題 2：選擇 12 種 3D 視覺風格（或「其他」自行描述）
依據參考網頁（`https://begin0808.github.io/share20261028/#/creative-extensions`）提供 **12 種標準視覺風格** 與 **「13. 其他」**（完整關鍵字與 Three.js 材質參數見 [references/creative-catalog.md](./references/creative-catalog.md)）：

| 編號 | 視覺風格名稱 | 核心視覺特徵 | 適合情境 |
| :---: | :--- | :--- | :--- |
| 01 | **溫暖玩具模型** | 低多邊形、暖色光、移軸模糊，宛如桌上微縮模型城市 | 學校介紹、招生宣傳、生活地圖 |
| 02 | **黏土動畫風** | 圓滾滾手捏質感、柔和陰影、微動作停格彈跳感 | 國小教育、親子活動、繪本故事 |
| 03 | **紙雕立體書** | 紙片分層疊出、紙紋材質、翻頁或轉動視角時立起 | 語文課程、校史故事、閱讀推廣 |
| 04 | **積木拼裝風** | 標準顆粒積木構成（`InstancedMesh`），點擊可爆炸拆解 | STEAM 教育、工程、機械實作 |
| 05 | **方塊像素世界** | 體素（Voxel）方塊沙盒地形與像素貼圖，學生共鳴高 | 資訊科系、資訊社團、共創活動 |
| 06 | **卡通描邊動畫風** | 平塗純色塊（Toon Shading）搭配俐落黑色外框線 | 青少年族群、社團展演、動漫主題 |
| 07 | **水彩繪本風** | 低飽和配色、紙張纖維紋理與邊緣柔和自然暈染 | 美術教育、文學課堂、生命教育 |
| 08 | **藍圖工程線稿** | 深藍網格底色配發光白線條，點擊後由線框長出立體結構 | 機械土木、營建製圖、架構展示 |
| 09 | **霓虹賽博夜城** | 暗黑夜景基底、Bloom 發光霓虹招牌與雨後地面倒影 | 資訊電競、科技展覽、夜間成果展 |
| 10 | **復古像素遊戲** | 固定 45° 等距正交視角（Isometric）加復古像素化後製 | 懷舊校慶、校園解謎、遊戲化闖關 |
| 11 | **水晶玻璃折射** | 半透明折射晶體（Transmission）、柔和穿透光與極簡白底 | 科學展覽、榮譽頒獎、專題發表 |
| 12 | **剪影光影皮影戲** | 剪影輪廓與強烈背光對比，融合剪紙鏤空與東方配色 | 人文社科、傳統在地文化、歷史故事 |
| 13 | **其他（自行描述）** | 由使用者自訂描述或上傳參考圖（例如：粉彩青瓷手繪散步地圖風） | 品牌專屬視覺或混合客製風格 |

### 問題 3：選擇 15 種空間比喻模型（含「群島」，或「其他」自行描述）
依據參考網頁（`https://begin0808.github.io/share20261028/#/creative-extensions`）提供包含「群島」在內之 **15 種空間比喻模型** 與 **「16. 其他」**（註：`01`–`10` 為原站 `creative-extensions` 明列模型；原站標題雖標示群島外 14 種，但前端九宮格僅渲染 9 張卡片，故 `11`–`15` 為整合自同站其他實戰章節與經典微縮拓撲之 `[補充擴充]` 模型，詳見 [references/creative-catalog.md](./references/creative-catalog.md)）：

| 編號 | 空間比喻模型 | 中心核心 vs. 單元節點拓撲關係 | 代表互動亮點 |
| :---: | :--- | :--- | :--- |
| 01 | **浮空群島與木拱橋（經典群島）** | 中央為核心支援主島，各單元為八角獨立小島，木拱橋相連 | 點島飛航特寫、橋上漫步小人與尋寶 |
| 02 | **星系與星球** | 中央為發光恆星，各單元為繞行行星，子分類為小衛星 | 搭火箭降落星球表面、跨域連線成星座 |
| 03 | **太空站與飛船** | 艦橋為指揮核心，各艙室模組代表不同主題單元 | 穿越艙門走廊、點擊「登艦報到」互動 |
| 04 | **熱氣球嘉年華** | 每顆彩色熱氣球為一單元，吊籃內承載微縮場景 | 氣球隨人氣緩緩升降、黃昏點燈特效 |
| 05 | **列車與軌道路線圖** | 每一車站為一單元，轉乘大站為跨領域核心樞紐 | 小火車動態進站開門、呈現進路發展軌跡 |
| 06 | **主題遊樂園** | 各項遊樂設施代表不同專長單元，入口售票亭為適性測驗 | 集章闖關卡、搭摩天輪高空俯瞰全園區 |
| 07 | **海底城市與泡泡** | 每個透明水下生態泡泡為一單元，潛水艇穿梭導覽 | 魚群環繞游過、海面灑下動態丁達爾光柱 |
| 08 | **一棵知識大樹** | 粗壯樹幹為核心精神，大樹枝為分類群，果實／樹屋為各單元 | 四季落葉時序變化、松鼠於枝椏間跳躍 |
| 09 | **天空之城浮島** | 漂浮於多層雲海上的高低雙環倒錐岩塊浮島，飛船與雲橋串聯 | 穿雲運鏡、島緣瀑布或垂藤、雙環生活圈分級 |
| 10 | **互動大富翁桌遊** | 環狀立體棋盤每一格代表一個地標或知識單元 | 擲骰子前進、觸發機會命運知識問答卡 |
| 11 | **3D 旋轉地球儀與經緯座標** `[補充擴充]` | 可自由撥動旋轉之立體星球，各單元依區域／主題分佈於球面 | 真實時區日夜晨昏線、各地即時天氣連動 |
| 12 | **六角拼圖大陸（卡坦島板塊）** `[補充擴充]` | 緊密鑲嵌之蜂巢六角地形板塊，相鄰邊界象徵跨域交集 | 板塊點擊抬升發光、關聯路徑連線浮現 |
| 13 | **立體建築剖面與樓層娃娃屋** `[補充擴充]` | 單棟或多棟可逐層掀開屋頂之微縮建築，每層／每室為一單元 | 樓層剖切切換、室內微縮家具與角色演繹 |
| 14 | **奇幻書架與立體藏書閣** `[補充擴充]` | 巨型木質書櫃中每冊立體書代表一分類，中央閱讀桌為總覽 | 點選書背抽出自動翻開立體微縮場景 |
| 15 | **微型生態箱與玻璃溫室群** `[補充擴充]` | 中央噴泉廣場串聯多座透明玻璃生態瓶／溫室穹頂單元 | 玻璃折射光影、瓶內專屬微氣候粒子特效 |
| 16 | **其他（自行描述）** | 由使用者自訂空間結構、動線邏輯與節點隱喻 | 依自訂拓撲量身規劃鏡頭軌跡與連接器 |

---

## 二、 需求分析、計畫核准與跨模型接手檢查點（Phase 2 & Phase 3）

### 1. 分析需求並提交實作計畫驗證（Verification Gate）
收齊三問答案與素材後，先執行資料與技術盤點，並產出實作計畫（Artifact `implementation_plan.md`，設定 `RequestFeedback: true`）交由使用者審閱核准：
1. **資料與法規個資盤點**：確認資料筆數、編碼格式（UTF-8 BOM 或舊版官網 Big5 轉碼）、缺漏值清洗規則，並執行**公開儲存庫個資遮蔽檢查**（如榜單學生姓名強制遮蔽為 `李OO`、移除私人電話與內部通行碼）。
2. **空間拓撲與色票定錨**：列出中央核心地標與各單元節點之座標佈局（內外環／軌道／站點）、方位校對錨點（避免平面圖與配置圖旋轉 180° 顛倒），以及日夜四時段色票。
3. **分階段交付清單（預設 6 個核心階段）**：明確定義 Stage 1 至 Stage 6 的產出檔案與驗收指標，**經使用者同意後才進入程式實作**。

### 2. 跨模型無縫接手檢查點鐵律（Persistent Stage Checkpoint）
為防止大型 3D 專案中途遭遇 Token 額度耗盡或切換模型導致上下文斷裂，**專案啟動時必須立即初始化進度紀錄檔**（預設路徑：`about/island_project_notes.md`，若無 `about/` 子目錄則置於專案指定文件目錄），且**每完成任何一個階段（Stage 1～6）或後續彩蛋／追加功能，必須在當下立即更新該檔案**！

#### 標準管理腳本呼叫（推薦使用內建 CLI 確保格式零走樣）
```powershell
# 1. 初始化專案紀錄檔（含跨模型接手狀態快照 + TODO + Done 雙位數流水號表頭）
python "C:\Users\Kermit\.gemini\config\skills\K06-island-for-Gemini\scripts\island_notes_manager.py" init --file "<專案路徑>/about/island_project_notes.md" --title "<專案名稱>" --theme "<主題>" --style "<視覺風格>" --metaphor "<空間比喻>" --entry "island.html"

# 2. 每完成一個階段立即寫入檢查點（自動遞增 01, 02... 流水號並更新待辦狀態）
python "C:\Users\Kermit\.gemini\config\skills\K06-island-for-Gemini\scripts\island_notes_manager.py" complete --file "<專案路徑>/about/island_project_notes.md" --stage "Stage 2" --name "資料層與即時狀態引擎" --summary "<完成內容與驗證數據摘要>" --prompt-file "<使用者原始提示詞暫存檔.txt>" --next-todo "<下一階段預計執行內容>"

# 3. 新模型接手時一鍵讀取當前進度與接手快照
python "C:\Users\Kermit\.gemini\config\skills\K06-island-for-Gemini\scripts\island_notes_manager.py" status --file "<專案路徑>/about/island_project_notes.md"
```

#### `island_project_notes.md` 強制格式規範
1. **頂部「跨模型接手狀態快照（Handover Snapshot）」**：記錄專案主題、選定視覺風格、空間比喻模型、前端技術棧、核心檔案清單、本地測試網址與最後完成階段，讓接手模型在 10 秒內完整掌握全局。
2. **`## 待辦事項 (TODO)`**：明確列出尚未執行的階段與下一步動作；全部完成時標註 `✅ 無待辦`。
3. **`## 已完成事項 (Done)`**：嚴格採用以下 4 欄結構：
   - `編號`：從 `01` 開始之雙位數流水號（`01`, `02`, ..., `24`）。
   - `階段及項目名稱`：將階段代號置於項目名稱前方並以 `<br>` 換行（例如：`Stage 1<br>參考站拆解、視覺地標分析與實作計畫核准`、`【彩蛋】紅綠燈-1<br>校園長週期號誌建模`、`【追加】一鍵拍貼<br>4 角浮水印美照拍貼機`）。
   - `完成內容摘要`：具體記錄新增／修改之檔案、核心演算法與驗證數據（如靜態 Mesh 縮減率、Console 0 錯誤）。
   - `我下的提示詞`：**必須 100% 忠實呈現使用者輸入的原始命令原文**（多行以 `<br>` 連接；同一提示詞涵蓋多階段時後續階段填 `同上`），嚴禁由 AI 自行改寫或濃縮使用者原話！

---

## 三、 標準六階段建置架構與可選豐富性模組

詳細程式碼樣板與幾何合併實作請參閱 [references/engineering-patterns.md](./references/engineering-patterns.md)。預設優先採用**免編譯原生 ES Modules + Three.js `0.170.0` CDN `importmap`**（零 `node_modules` 污染、相容本地伺服器與 GitHub Pages；若使用者明確指定 React Three Fiber + Vite 則依指定辦理）：

| 階段 | 建議模組職責 | 必備工程驗收標準 |
| :---: | :--- | :--- |
| **Stage 1** | **架構拆解與實作計畫核准** | 完成資料欄位映射、色票提取、核心地標三視圖拆解，初始化 `island_project_notes.md` 並取得使用者計畫核准。 |
| **Stage 2** | **資料層與業務邏輯引擎**<br>(`assets/island/island-data.js`) | `TextDecoder('utf-8')` + BOM（`\uFEFF`）剝除、內建離線結構化備援常數、以 `Intl.DateTimeFormat` 指定 `timeZone: 'Asia/Taipei'`（或具 `temporal-polyfill` 偵測之 `Temporal.ZonedDateTime`，嚴禁 `PlainDateTime`）判定即時狀態、4～9 題適性推薦測驗權重矩陣，以及外部字串一律採 `textContent` / DOM API 寫入（禁直接拼接 `innerHTML`）。 |
| **Stage 3** | **3D 積木引擎、幾何合併與移軸後製**<br>(`assets/island/island-world.js`) | 圓角積木幾何（`RoundedBoxGeometry` 等）與材質單例快取池、`bakeStaticGroup` 同材質頂點色靜態零件合併（**Draw Calls / 靜態 Mesh 縮減率須達 75% 以上**，單次建置超過 `50 ms` 時以 `scheduler.yield()` 分段讓出主執行緒）、`EffectComposer` 移軸微縮後製（**手機寬度 ≤ 768 px 自動關閉省電**）、Open-Meteo 即時天氣與日夜四時段光影，以及 `visibilitychange` 離頁自動暫停節能。 |
| **Stage 4** | **中央核心主島與精神地標建模**<br>(`assets/island/island-landmarks.js`) | **零外部 GLTF / OBJ / FBX 模型檔**，100% 以程式基本幾何拼裝中央核心地標（搭配高解析 `CanvasTexture` 文字牌匾）、廣場鋪面、植栽與共用角色元件。 |
| **Stage 5** | **各單元節點微縮建築與互動小夥伴**<br>(`assets/island/island-shops.js` 或 `island-nodes.js`) | 為每個資料單元打造具高辨識度之微縮建築與招牌道具模型、連接橋樑／航線動態載具，以及散佈全場之尋寶小夥伴（如 12 隻松鼠或校園吉祥物，設定嚴格白名單 ID 計數防溢位）。 |
| **Stage 6** | **響應式 HUD 介面與雙端 E2E 驗證**<br>(`island.html`, `island-ui.js`, `island-map.css`) | 具 `<header>` / `<main>` / `<nav>` / `<search>` 語意地標與 `color-scheme` / `referrer` 標頭；採用原生 `<dialog>.showModal()` 承載測驗／拍照彈窗、`[popover]` 承載非阻塞提示、桌面側欄／手機 `100svh` 兩段式 Bottom Sheet；2D 名牌採 `translate3d` 整數像素更新；串聯 `prefers-reduced-motion` 初始狀態，並通過 Playwright 桌機與手機零錯誤、觸控熱區與無障礙驗證。 |

### 可選豐富性擴充模組（皆須採獨立 JS 解耦掛載，不污染核心檔）
當基礎 6 階段完成、使用者希望進一步提升豐富度與社群傳播力時，可推薦並獨立掛載以下實戰驗證模組：
1. **一鍵美照拍貼機 (`assets/island-camera.js`)**：於底部導覽列上方中央配置浮動快門鈕，強制調用 WebGLRenderer 擷取無 DOM 雜訊之純淨 3D 畫面，合成品牌吉祥物毛玻璃浮水印（支援「↖ 左上、↗ 右上、↙ 左下、↘ 右下」4 角即時重繪切換，確保文字對比度 ≥ 4.5:1）、快門閃光（嚴禁超過每秒 3 次閃爍）與時間戳 PNG 下載。
2. **裝置分級漫步 NPC 系統 (`assets/island/island-dynamic-npc.js`)**：桌機配置約 30～33 位常駐島民與跨島角色、手機自動降級為約 12 位兼顧省電；採用扁平圓盤假陰影實現零額外 Shadow Pass 負擔。
3. **浮動音樂／YouTube MV 迷你播放器**：桌機右下角呈現圓角影片卡（顯示畫面時隱藏迷你列避免雙重控制，最小化 `_` 時才切換迷你列）；手機端自動隱藏影片畫面，僅於 `bottom: calc(84px + env(safe-area-inset-bottom, 0px))`（距底列淨空 ≥ 32 px）呈現精緻迷你播放列，關閉後收合為頂端列日夜按鈕右側之黑底音符常駐徽章，預設音量設定為 `25%` 防爆音。
4. **開發日誌與技術致敬頁 (`about/*_dev.html`)**：採用暖米色紙感背景與 `Noto Sans TC` 字體，誠實揭露靈感致敬來源、AI 協作模型版本、零外部模型純幾何技術亮點與零個資防線；**主站入口與返回浮島按鈕一律採用當前分頁導航（`target="_parent"`）**，並於共享 CSS 啟用 `@view-transition { navigation: auto; }`（置於 `@media (prefers-reduced-motion: no-preference)` 內），徹底杜絕瀏覽器分頁無限增生並提供漸進增強轉場。

---

## 四、 十大實戰防坑鐵律（現代 Web 標準與 24 階段調優總結）

1. **浮島呼吸起伏防淹腳踝鐵律**：若浮島／節點具備上下懸浮呼吸動畫（如 `bob = ±0.14`）或 Hover 抬升，所有島上常駐小人與道具**必須掛載於該島根節點（`islandRoot`）本地座標系**（`y = 0.045`），嚴禁置於全域世界空間，否則島嶼升起時草皮會直接淹沒角色腳踝。
2. **跨島跳躍防穿模與落腳雲鐵律**：跨島移動角色（如巡航吉祥物）必須採用**單段完整拋物線大跨越**，於島嶼半徑內部署動態高度守衛（`Elevation Guard: y >= baseY + 0.05`）並規劃前庭繞房航點避開建築包圍盒；島間空中跳躍點正下方應配置低多邊形「落腳小雲朵」（每段島距至多 1～2 朵，避免空域雜亂或踩空氣起跳）。
3. **跨島漫步、分頁背景暫停與減動偏好鐵律**：跨島行走之 NPC 必須嚴格代入木拱橋拋物線高度公式行走，絕不可直線橫越懸空斷層；全站「動態」開關（`uiState.animate`）應預設讀取 `window.matchMedia('(prefers-reduced-motion: reduce)').matches` 並監聽其 `change` 事件，同時綁定 `visibilitychange` 於背景分頁自動暫停 WebGL 迴圈，**暫停恢復時必須重設 `lastTimestamp`**，杜絕時間差暴衝瞬移。
4. **俯視操作無遮蔽鐵律**：多數使用者以 35°～60° 俯視角操作群島，號誌燈箱（如讀秒紅綠燈）或招牌**不得加裝突出遮光罩（Visors）**，並須避開樹冠與攤位頂棚穿模，確保俯視鏡面與讀秒清晰可見。
5. **有機角色圓滑零穿模與原生覆蓋層鐵律**：拼裝圓潤吉祥物時，避免粗壯球體肩膀與手臂硬插穿模；優先使用 `THREE.LatheGeometry` 旋轉構建一體成形軀幹，搭配連續變徑圓管（`TubeGeometry`）使雙手自然貼合腹部表面。同時所有互動彈窗／測驗應採原生 `<dialog>.showModal()`（搭配 `:modal` 與 `::backdrop` 的 `overscroll-behavior: contain` 阻斷背景捲動），非阻塞選單採 `[popover]`，不重造焦點陷阱。
6. **手機窄螢幕（360 px）品牌卡、安全區與觸控熱區鐵律**：啟用 `viewport-fit=cover` 時，頂端 `.topbar` 與底部列必須套用 `env(safe-area-inset-*)` 避開劉海與 Home Bar；品牌卡標題列設定 `flex-wrap: nowrap; gap: 8px;`，標題字級改採 `rem` 基準之 `clamp(0.875rem, 0.72rem + 1vw, 1rem)`（最大值 ≤ 2.5× 最小值，尊重系統字級縮放）並搭配 `min-inline-size: 0` 防溢出；右上角 `28px` 圓形圖標鈕（`<span aria-hidden="true">ⓘ</span>`）納入 Flex 尾端排版確保淨空（> 6 px），並於 `@media (pointer: coarse)` 透過 `::after` 偽元素將可點擊熱區擴展至 `44×44 px`。
7. **2D 浮動名牌整數像素與合成層位移鐵律**：以 `Vector3.project(camera)` 換算螢幕座標更新 HTML 名牌時，必須使用 `Math.round(x)`、`Math.round(y)` 對齊整數像素並強制以 CSS `transform: translate3d(...)`（或 `translate`）更新位置，**嚴禁**於動畫迴圈內改寫 `left`/`top` 或交錯讀寫 `getBoundingClientRect()` 造成 Layout Thrashing；同時對外部文字資料一律使用 `textContent` 防範 DOM XSS。
8. **尋寶計數白名單防溢位鐵律**：可點擊對話之攤位志工或環境彩蛋必須與「尋寶小遊戲」目標嚴格分離（採用唯一 ID `Set` 白名單計數），集滿上限（如 `12/12`）後文案自動切換為祝賀語（如「好眼力，已尋獲全部小夥伴」），杜絕出現 `13/12` 破表錯誤。
9. **雙端實機截圖、觸控熱區與無障礙驗收鐵律**：每次修改 UI 或 3D 佈局後，必須執行 `scripts/audit_island_e2e.py`（或對接 `A09-webapp-testing-for-Gemini`）於桌機（`1280x800`）與窄版手機（`360x740`、`390x844`）實測檢查 `bounding_box()` 間距、水平無溢出、觸控目標最小尺寸、基礎無障礙結構（`lang` / `title` / `<main>` / `alt`）、`reduced-motion` 降級、Console 0 錯誤與靜態幾何合併率，確認無誤後才回報使用者。
10. **目錄純淨隔離鐵律**：所有 Playwright 驗收截圖、模型角度預覽圖與測試腳本，一律輸出至對話專屬 `scratch/` 目錄或專案 `_output/` 隔離子目錄（並確認列入 `.gitignore`），嚴禁散落於專案根目錄。

---

## 五、 自動化品質驗收指令（E2E Health & Anti-Collision Audit）

完成 Stage 6 或任何 UI／場景擴充後，執行內建自動化稽核腳本驗證雙端渲染、零外部模型、幾何合併率與窄螢幕防遮擋：

```powershell
# 若目標已運行於本地伺服器（如 XAMPP Apache 或 Vite Dev Server）
python "C:\Users\Kermit\.gemini\config\skills\K06-island-for-Gemini\scripts\audit_island_e2e.py" --url "http://localhost/<專案路徑>/island.html" --out-dir "<隔離輸出目錄>"

# 若需自動啟動臨時本地靜態伺服器進行測試
python "C:\Users\Kermit\.gemini\config\skills\K06-island-for-Gemini\scripts\audit_island_e2e.py" --root "<專案根目錄>" --entry "island.html" --out-dir "<隔離輸出目錄>"
```

---

## 六、 參考文件索引（Progressive Disclosure）

- [references/creative-catalog.md](./references/creative-catalog.md)：12 種 3D 視覺風格（含 Three.js 光影材質配方與提示詞關鍵字）、15 種空間比喻模型完整規格、6 大跨域應用情境與 `$0` 零主機費雲端部署表。
- [references/engineering-patterns.md](./references/engineering-patterns.md)：免編譯 `importmap` 架構範本、`bakeStaticGroup` 同材質幾何合併器、移軸微縮 Shader、UTF-8 BOM 安全讀取器、`Elevation Guard` 防穿模守衛、本地座標 NPC 系統與一鍵拍貼機核心程式碼樣板。
