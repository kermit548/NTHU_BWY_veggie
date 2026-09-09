# 一、初始目標

希望寫出一個主要使用php語言的活動網站，可以讓使用者簡單填寫系級、姓名、郵件後，發願吃素食的頻率（一週三次以上/一週一次/少吃肉），最後會以匿名點狀呈現在dashboard 

---

# 二、實現過程

1. **AI 第一版給出 LAMP（Apache + PHP + MySQL/MariaDB）的架構**

2. **考慮資料庫架設不易，要求提供第二版將資料庫換成 Google 試算表**

3. **考慮瀏覽方便性，選定發布在 Github 平台，捨棄 PHP，使用純 HTML**

---

# 三、**完整部署步驟**

## 步驟 1：建立 Google Forms 作為報名表

1. 登入 Google 帳號，建立 Google Forms。
2. 設定欄位：系級、姓名、email、蔬食頻率（三選一）。
3. 表單送出後，自動寫入 Google Sheets（表單回應）。
4. 取得 Google Sheets 的 Spreadsheet ID（URL 中 /spreadsheets/d/xxxxxx）。

## 步驟 2：公開 Google Sheets 統計資料

1. 開啟 Google Sheets，點選「分享」→「任何人有連結都可以檢視」。
2. 或者，使用 [Google Sheets API](https://developers.google.com/sheets/api/quickstart/js) 讓前端 JavaScript 能讀取資料。
3. 記下 Spreadsheet ID。

## 步驟 3：設計前端 dashboard 頁面（dashboard.html）

1. 在本機建立 veggie/ 資料夾，新增 index.html、dashboard.html、style.css、dashboard.js。
2. index.html：放 Google Forms 的嵌入碼（iframe）。
3. dashboard.html：用 JavaScript 讀取 Google Sheets，計算三類人數，畫出點狀圖。

範例：

````markdown
# index.html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>特蔬任務｜報名發願</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>特蔬任務｜報名發願</h1>
    <iframe src="https://docs.google.com/forms/d/e/你的FormID/viewform?embedded=true" width="640" height="800" frameborder="0" marginheight="0" marginwidth="0">載入中…</iframe>
    <p>送出後可前往 <a href="dashboard.html">匿名儀表板</a> 查看參與統計。</p>
  </div>
</body>
</html>
````

````markdown
# dashboard.html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>特蔬任務｜匿名儀表板</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>特蔬任務｜匿名儀表板</h1>
    <div id="summary"></div>
    <div class="boards">
      <div class="board">
        <h2>一週三次以上</h2>
        <canvas id="canvas-three" width="360" height="300"></canvas>
      </div>
      <div class="board">
        <h2>一週一次</h2>
        <canvas id="canvas-one" width="360" height="300"></canvas>
      </div>
      <div class="board">
        <h2>我願意少吃肉</h2>
        <canvas id="canvas-less" width="360" height="300"></canvas>
      </div>
    </div>
  </div>
  <script src="dashboard.js"></script>
</body>
</html>
````

````markdown
# dashboard.js
(async function(){
  // 以 Google Sheets 的「公開 CSV」方式取得資料
  const SHEET_ID = '你的SpreadsheetID';
  const SHEET_GID = '0'; // 預設第一個工作表
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;
  const res = await fetch(url);
  const csv = await res.text();

  // 解析 CSV（建議用 PapaParse 或自己拆分）
  const lines = csv.split('\n').filter(x=>x.trim());
  const header = lines[0].split(',');
  const pledgeIdx = header.findIndex(h => h.includes('蔬食頻率') || h.toLowerCase().includes('pledge'));
  let counts = { three_plus: 0, one: 0, less_meat: 0 };
  for (let i=1; i<lines.length; i++) {
    const cols = lines[i].split(',');
    const p = cols[pledgeIdx] || '';
    if (p.includes('三次')) counts.three_plus++;
    else if (p.includes('一次')) counts.one++;
    else if (p.includes('少吃肉')) counts.less_meat++;
  }
  const total = counts.three_plus + counts.one + counts.less_meat;
  document.getElementById('summary').textContent =
    `總參與數：${total}（三次以上：${counts.three_plus}；一週一次：${counts.one}；少吃肉：${counts.less_meat}）`;

  function drawDots(canvasId, count, color) {
    const cvs = document.getElementById(canvasId);
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0,0,cvs.width,cvs.height);
    for (let i=0; i<count; i++) {
      const x = Math.random() * (cvs.width - 16) + 8;
      const y = Math.random() * (cvs.height - 16) + 8;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  drawDots('canvas-three', counts.three_plus, '#A93226');
  drawDots('canvas-one', counts.one, '#D35400');
  drawDots('canvas-less', counts.less_meat, '#F1C40F');
})();
````

## 步驟 4：推送到 GitHub

1. 建立 repo `veggie`。
2. 將上述所有檔案（index.html, dashboard.html, style.css, dashboard.js）push 到 repo。
3. 進入 repo → Settings → Pages → 設定分支（如 main）和目錄（如 root 或 /veggie）。
4. 取得網址：`https://xxxx.github.io/veggie/`

## 步驟 5：測試

1. 開啟 `https://xxxx.github.io/veggie/`，填寫 Google Forms。
2. 開啟 `https://xxxx.github.io/veggie/dashboard.html`，確認 dashboard 能正確統計並顯示匿名點狀圖。

---

# 四、**補充：CORS (跨來源資源共用) 限制與解決方案**

- 無論 CSV 或 HTML，Google Sheets 公開網址預設皆未附帶 `Access-Control-Allow-Origin` 回應標頭，瀏覽器純前端（`fetch` 或 `XMLHttpRequest`）會因同源政策而被攔截。
- 私密瀏覽模式對跨來源請求的限制更為嚴格，容易直接引發網路錯誤。
- 過去常見的免金鑰公開代理（如 `corsproxy.io`）已全面終止匿名 Legacy Proxy 服務（回傳 `403 keyless_legacy_url` 錯誤），其他公開 Proxy 亦常有連線超時與頻寬配額限制。

### 最佳解法：Google Visualization API 原生 JSONP 模式

透過動態注入 `<script>` 標籤載入 Google Visualization API，利用 JSONP 原理天然規避瀏覽器 CORS 限制，完全不需依賴任何不可控的第三方 Proxy：

```javascript
const callbackName = 'handleGoogleSheetResponse_' + Date.now();
window[callbackName] = function (response) {
  // 取得結構化 table 資料
  const table = response.table;
  // 處理統計與畫圖...
};

const script = document.createElement('script');
script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${SHEET_GID}&tqx=responseHandler:${callbackName}`;
document.body.appendChild(script);
```

### 架構特性

1. **零第三方相依**：直接與 Google 官方端點通訊，無中介 Proxy 斷線或改版收費風險。
2. **純前端相容性**：無論部署於 GitHub Pages 或本地 XAMPP 環境皆可正常運作。
3. **資料結構化**：回傳格式為標準 Table 物件，無須手動解析逗號或雙引號跳脫。

---

