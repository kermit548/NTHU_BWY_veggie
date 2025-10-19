(async function(){
  // 以 Google Sheets 的「公開 CSV」方式取得資料
  const SHEET_ID = '1eA2OTIWOxBqL_46ytLDLR4alD-P1G_fYVLD1UJi8S_Y';
  const SHEET_GID = '0'; // 預設第一個工作表
  const url = `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`; //加掛公開 CORS Proxy

try {
  const res = await fetch(url);
  if (!res.ok) throw new Error('網路錯誤');
  const csv = await res.text();  

  // 解析 CSV
  const lines = csv.split('\n').filter(x => x.trim());
  const header = lines[0].split(',');
  const pledgeIdx = header.findIndex(h => h.includes('我願意吃蔬食的頻率'));
  if (pledgeIdx === -1) {
    document.getElementById('summary').textContent = '找不到「我願意吃蔬食的頻率」欄位';
    return;
  }

  let counts = { three_plus: 0, one: 0, less_meat: 0 };
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const p = cols[pledgeIdx] || '';
    if (p.includes('三次')) counts.three_plus++;
    else if (p.includes('一次')) counts.one++;
    else if (p.includes('少吃肉')) counts.less_meat++;
  }
  const total = counts.three_plus + counts.one + counts.less_meat;
  //document.getElementById('summary').textContent = '標題列：' + header.join(',');
  document.getElementById('summary').textContent =
    `總參與數：${total}（三次以上：${counts.three_plus}；一週一次：${counts.one}；少吃肉：${counts.less_meat}）`;

  function drawDots(canvasId, count, color) {
    const cvs = document.getElementById(canvasId);
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * (cvs.width - 16) + 8;
      const y = Math.random() * (cvs.height - 16) + 8;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  drawDots('canvas-three', counts.three_plus, '#006600');
  drawDots('canvas-one', counts.one, '#339900');
  drawDots('canvas-less', counts.less_meat, '#00FF00');
  
  // 畫圓餅圖函式
  function drawPieChart(canvasId, data, colors, labels) {
    const cvs = document.getElementById(canvasId);
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const total = data.reduce((a, b) => a + b, 0);
    let startAngle = -Math.PI / 2;
    const cx = cvs.width / 2;
    const cy = cvs.height / 2;
    const radius = Math.min(cx, cy) - 20;

    for (let i = 0; i < data.length; i++) {
      const sliceAngle = (data[i] / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();

      // 標籤文字
      const midAngle = startAngle + sliceAngle / 2;
      const tx = cx + Math.cos(midAngle) * (radius + 15);
      const ty = cy + Math.sin(midAngle) * (radius + 15);
      ctx.fillStyle = "#333";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[i] + ` (${data[i]})`, tx, ty);

      startAngle += sliceAngle;
    }
  }

  // 呼叫圓餅圖
  const data = [counts.three_plus, counts.one, counts.less_meat];
  const colors = ['#006600', '#339900', '#00FF00'];
  const labels = ['三次以上', '一週一次', '少吃肉'];
  drawPieChart('canvas-pie', data, colors, labels);
  
} catch (e) {
  document.getElementById('summary').textContent = '資料載入失敗：' + e.message;
}
})();
