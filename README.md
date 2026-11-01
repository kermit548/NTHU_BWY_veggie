# K06-island-for-Gemini 島嶼建設技能包 (Island Builder Skill Package)

本分支（`island-tools`）獨立收錄由「2026 清大福青社天空之城蔬食地圖」24 階段實戰建置、調優與防坑經驗所淬鍊而成的全域 Agent 技能包 —— **`K06-island-for-Gemini`**。

本技能包旨在協助開發者與 AI Agent 在無需外包 3D 建模團隊的前提下，透過純數學程序化幾何（Three.js）與結構化提示詞，全自動建置跨裝置（桌機、平板、極窄螢幕手機）的高效能微縮 3D 互動島嶼網站。

---

## 目錄結構與組件職責

```text
├── SKILL.md                          # 技能主控規格書（三問引導、階段計畫驗證、接手檢查點鐵律）
├── references/
│   ├── creative-catalog.md           # 視覺與空間拓樸字典（12 種風格 + 15 種比喻模型 + $0 部署矩陣）
│   └── engineering-patterns.md       # 實戰程式碼範本（靜態幾何頂點色合併、BOM 解碼、純 WebGL 浮水印拍貼）
└── scripts/
    ├── island_notes_manager.py       # 專案進度管理 CLI（維護跨模型接手快照、雙位數流水號與原始提示詞）
    └── audit_island_e2e.py           # 雙端防碰撞自動化稽核器（Playwright 雙端 E2E 渲染與排版檢驗）
```

### 1. `SKILL.md` (主控規格書)
* **啟動強制三問（Phase 1）**：在編寫任何程式碼前，強制透過三道引導問題鎖定：
  1. 內容主題與資料格式（學校科系、自身興趣、周邊店家）。
  2. 12 種 3D 視覺風格（溫暖玩具、皮克斯、賽博龐克、極簡低多邊形等）或使用者自訂。
  3. 15 種空間比喻模型（天空之城群島、星系星球、地下鐵、立體娃娃屋等）或使用者自訂。
* **計畫先行驗證門檻（Phase 2）**：先產出完整實作計畫供使用者確認，核准後方可建置。
* **跨模型接手檢查點（Phase 3）**：每完成一個階段，即時更新 `island_project_notes.md`，完整記錄雙位數流水號（`01`, `02`...）、項目名稱與未經濃縮的原始提示詞。即使 Token 耗盡，其他模型亦可無縫接手。
* **10 條血淚防坑鐵律**：收錄避免 `.glb` 外部依賴、靜態網格頂點色合併、手機端自動降級關閉移軸模糊、NPC 局部座標防脫節、極窄螢幕（`360px`）品牌卡防折行等實戰規範。

### 2. `references/creative-catalog.md` (視覺與拓樸字典)
* 完整收錄源自李俊儀教授團隊分享之 12 種視覺風格參數矩陣（含原廠說明、中英文 Prompt 關鍵字與 Three.js 材質光影配方）。
* 收錄包含「群島」在內的 15 種空間比喻模型（10 種原廠核心比喻模型 + 5 種補充拓樸比喻模型），並附帶三維座標排列邏輯。
* 提供 GitHub Pages / Cloudflare Pages / Vercel 之 `$0` 零成本靜態託管架構表。

### 3. `references/engineering-patterns.md` (實戰程式碼範本)
* 提供完整可執行的 ES Modules + Three.js `0.170.0` CDN HTML/CSS 骨架。
* `bakeStaticGroup` 模組：將島上數百個靜態方塊、建築與裝飾合併為頂點色 BufferGeometry，網格縮減率達 `75%` 至 `94%`。
* `islandRoot` 動態 NPC 局部座標同步演算法與防沉入過橋演算法（Elevation Guard）。
* 純 WebGL 離線四角浮水印拍貼相機合成器。

### 4. `scripts/island_notes_manager.py` (進度管理 CLI)
* 零外部套件相依（僅需 Python 3.8+ 標準庫）。
* 支援 `init`、`complete` 與 `status` 子命令，自動防範 Windows 中文編碼衝突（`sys.stdout.reconfigure(encoding="utf-8")`），安全保存多行與特殊管道符號（`|`）之使用者原始提示詞。

### 5. `scripts/audit_island_e2e.py` (雙端防碰撞自動化稽核器)
* 整合 Playwright，自動在背景以三種視窗解析度（桌機 `1280x800`、窄螢幕手機 `360x740`、標準手機 `390x844`）進行端對端檢驗。
* 自動偵測 Console Error、Page Error、外部未授權 3D 模型請求、靜態網格壓縮比率（`>= 75%`），以及 `360px` 視窗頂部品牌卡單行排版與右上角按鈕安全間距。

---

## 快速使用方式

### 方案 A：在 AntiGravity / Gemini 環境中載入
將此技能資料夾複製至使用者的全域 Skill 目錄：
```powershell
Copy-Item -Path ".\K06-island-for-Gemini" -Destination "$HOME\.gemini\config\skills\K06-island-for-Gemini" -Recurse
```
在任何對話中輸入：
> 「呼叫 K06-island-for-Gemini，我想做一個 3D 互動探索網站」

### 方案 B：手動調用輔助腳本

#### 初始化新專案進度紀錄
```bash
python scripts/island_notes_manager.py init \
  --file about/island_project_notes.md \
  --title "專案名稱" \
  --theme "學校科系介紹" \
  --style "01 溫暖玩具模型" \
  --metaphor "09 天空之城浮島"
```

#### 完成階段時記錄進度
```bash
python scripts/island_notes_manager.py complete \
  --file about/island_project_notes.md \
  --stage "Stage 1" \
  --name "幾何架構與座標配置" \
  --summary "完成核心主島與 8 座周邊浮島座標生成" \
  --prompt "請幫我建立 8 座浮島與中央主島..."
```

#### 執行雙端 E2E 渲染與排版檢驗
```bash
python scripts/audit_island_e2e.py \
  --url http://localhost/island.html \
  --out-dir _output/audit_reports
```

---

## 致敬與技術傳承

本技能包之視覺風格架構、空間比喻矩陣與教學理念，致敬國立臺南大學附屬高級中學探索群島、李俊儀教授 2026/10/28「3D 互動校園與教育應用」創意矩陣，以及 HEART 政策島之優秀設計理念。程式碼均依據實戰規範由 AI 全新程序化生成。
