(function () {
  // 以 Google Sheets 的 Visualization API (JSONP 模式) 取得資料，完全擺脫 CORS 限制與第三方 Proxy 依賴
  const SHEET_ID = '1eA2OTIWOxBqL_46ytLDLR4alD-P1G_fYVLD1UJi8S_Y';
  const SHEET_GID = '0'; // 預設第一個工作表
  const callbackName = 'handleGoogleSheetResponse_' + Date.now();

  // 定義全域回呼函式以接收 Google Visualization API 回傳的結構化資料
  window[callbackName] = function (response) {
    // 請求完成後清除動態建立的 script 標籤與全域變數
    const scriptEl = document.getElementById(callbackName);
    if (scriptEl) scriptEl.remove();
    delete window[callbackName];

    try {
      if (!response || response.status !== 'ok') {
        throw new Error('Google 試算表資料回傳狀態異常');
      }

      const table = response.table;
      const cols = table.cols.map(c => (c ? c.label : ''));
      const pledgeIdx = cols.findIndex(h => h && h.includes('我願意吃蔬食的頻率'));

      if (pledgeIdx === -1) {
        document.getElementById('summary').textContent = '找不到「我願意吃蔬食的頻率」欄位';
        return;
      }

      let counts = { three_plus: 0, one: 0, less_meat: 0 };

      // 解析 rows 資料
      table.rows.forEach(row => {
        const cell = row.c[pledgeIdx];
        const val = cell && cell.v ? String(cell.v) : '';
        if (val.includes('三次')) counts.three_plus++;
        else if (val.includes('一次')) counts.one++;
        else if (val.includes('少吃肉')) counts.less_meat++;
      });

      const total = counts.three_plus + counts.one + counts.less_meat;
      document.getElementById('summary').textContent =
        `總參與數：${total}（三次以上：${counts.three_plus}；一週一次：${counts.one}；少吃肉：${counts.less_meat}）`;

      // 繪製點狀圖
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

      // 繪製圓餅圖函式
      function drawPieChart(canvasId, data, colors, labels) {
        const cvs = document.getElementById(canvasId);
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        const sum = data.reduce((a, b) => a + b, 0);
        if (sum === 0) return;
        let startAngle = -Math.PI / 2;
        const cx = cvs.width / 2;
        const cy = cvs.height / 2;
        const radius = Math.min(cx, cy) - 20;

        for (let i = 0; i < data.length; i++) {
          const sliceAngle = (data[i] / sum) * 2 * Math.PI;
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
          ctx.fillStyle = '#333';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
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
      document.getElementById('summary').textContent = '資料解析失敗：' + e.message;
    }
  };

  // 動態建立 script 標籤發起 JSONP 請求
  const script = document.createElement('script');
  script.id = callbackName;
  script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${SHEET_GID}&tqx=responseHandler:${callbackName}`;
  script.onerror = function () {
    document.getElementById('summary').textContent = '無法載入 Google 試算表資料（請確認網路連線或試算表共用權限）';
    if (window[callbackName]) delete window[callbackName];
  };
  document.body.appendChild(script);
})();
