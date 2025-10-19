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

# 四、**補充：CORS (跨來源資源共用) 限制**

- 無論 CSV 或 HTML，Google Sheets 公開網址都沒有 CORS 標頭，前端 fetch 會被擋住。
- 瀏覽器前端 fetch 會被擋下，尤其在私密模式下，瀏覽器對 CORS 更嚴格。
- 一般模式有時可用，是因為瀏覽器快取或 session 差異，但這不保證穩定，也不安全。


若你要**跨域存取**，可用公開 CORS Proxy，例如  
`https://corsproxy.io/?` 或 `https://api.allorigins.win/raw?url=`

````markdown
const url = 'https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}';
// 下面程式碼同上
````

## 盲點提醒

- CORS proxy 有流量限制、可能不穩定，不適合正式專案。
- 若需要「將資料安全、穩定地提供給前端」，**後端代理仍是最理想方案**。

---
