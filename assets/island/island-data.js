// 2026 清大福青社蔬食地圖 — 資料層、UTF-8 BOM 安全解析與台灣時區即時營業狀態引擎
// 嚴守公開儲存庫資安防線：僅載入公開商業餐廳資訊，零引用學員個資與工作人員通關密碼。

export const NTHU_COORDS = { lat: 24.7961, lng: 120.9967, placeName: '新竹東區・清華大學' };

export const RAW_TSV_FALLBACK = `餐廳名稱\t餐廳地址\t推薦餐點\t價位\t分類（點心、輕食、麵類或蛋奶素等）\t營業時間\t聯絡電話\t入選115-1蔬食月地圖(特別推薦)\t入選115-1蔬食月地圖(標號)\t備註
雅素齋自然人文蔬食館\t新竹市東區光復路二段214號\t養生藥膳麵、招牌冰鎮滷味、香辣老虎蓋飯\t$100-200\t養生麵食蓋飯/全素蛋奶素\t週二至週五 17:30–21:00；週六至週日 11:30–14:00, 17:30–21:00 (週一公休)\t03-571-8222\t✔(清大周邊)\t\t
妙觀音素食\t新竹市東區軍功里光復路二段358號\t招牌紅燒麵、當歸湯麵 / 藥膳麵、酸辣湯\t$100-200\t中式麵食便當/全素\t週一至週五 11:00–20:30；週六至週日 11:0–21:00\t03-516-6767\t✔(清大周邊)\t\t
安姆士\t新竹市東區軍功里光復路二段376-14號\t招牌養生拌飯/拌麵、水果奶茶\t$30-100\t輕食與茶飲/全素蛋奶素\t週一至週五：11:30–14:00、17:00–20:00；週六：11:30–14:00；週日公休\t03-571-9246\t✔(清大周邊)\t\t
鼎盛蔬食便當\t新竹市東區光復路二段101號（國立清華大學風雲樓2樓）\t素食手作便當、健康蔬食餐盒、每日特色便當\t$80-120\t自助餐、便當/全素蛋奶素\t11:00–13:15，17:00–19:15 (週六公休，配合學校學期營運)\t0908-018-900\t✔(校內必吃)\t\t
棗子樹\t新竹市東區建新路23-1號\t素書香麵、招牌蛋煎粄條、素香滷飯\t$60-120\t麵食飯類小吃/全素蛋奶素\t11:00–14:00, 17:00–20:30 (週六公休)\t03-571-7277\t✔(清大周邊)\t\t
素怡園(交大二餐二樓素食自助餐)\t新竹市東區大學路1001號（陽明交通大學光復校區第二餐廳2樓）\t秤重素食自助餐、十穀飯、家常紅燒豆腐\t$70-150\t自助餐/全素蛋奶素\t週一至週五：11:00–13:30 、16:30–19:00；週六：11:00–13:30；週日公休\t0934-256290；03-571-2121 分機 59021\t\t✔(交大校內/腳踏車10分鐘可達)\t
一鮮素素食小館\t新竹市東區建中一路11號\t鐵板素排飯、砂鍋臭豆腐煲、三杯素雞套餐\t$80-160\t熱炒鐵板麵食/全素蛋奶素\t11:00–14:00, 17:00–20:30 (週日公休)\t03-573-0982\t\t✔（腳踏車10分鐘可達）\t
游媽媽素食小吃\t新竹市東區光復路二段235號\t古早味素油飯、招牌水餃、當歸粄條\t$40-100\t傳統麵食小吃/全素\t11:00–20:00 (依店家現場公告)\t03-573-7436\t\t✔（腳踏車10分鐘可達）\t
菜根香素食\t新竹市東區學府路219號\t手工素水餃、沙茶燴麵、招牌炒飯\t$60-120\t家常麵食炒飯/全素\t11:00–13:30, 17:00–19:30 (週六、週日公休)\t03-5723563\t\t✔（腳踏車10分鐘可達）\t(機車 10 分鐘內可達)
滿素圓\t新竹市東區立功里金城一路22號\t便當、酸辣湯、抄手\t$60-110\t中式麵食便當理/蛋奶素\t週一至週五：11:00–14:00, 17:00–20:00\t0978-330051\t\t✔（腳踏車10分鐘可達）\t`;

// 每座餐廳浮島之空間佈局、配色（對齊 VEG_MAP.jpg 黑標特別推薦 / 橘標單車 10 分鐘）與微縮主題設定
const SHOP_SPATIAL_META = {
  '雅素齋自然人文蔬食館': {
    id: 'yasuzhai',
    short: '雅素齋',
    ring: 'inner',
    badgeNo: 1,
    angleDeg: 36,
    radius: 15.2,
    baseY: 0.55,
    color: '#2c4a47',
    accent: '#4a8584',
    grass: '#a8cca8',
    vegMapTags: ['老店推薦', '百元友善'],
    travelHint: '校門對面步行約 5 分鐘',
    sceneDesc: '溫潤木質人文茶屋，桌上擺著熱氣騰騰的養生藥膳湯麵與冰鎮滷味拼盤。',
    lat: 24.794374,
    lng: 121.0001793
  },
  '妙觀音素食': {
    id: 'miaoguanyin',
    short: '妙觀音素食',
    ring: 'inner',
    badgeNo: 2,
    angleDeg: -18,
    radius: 15.2,
    baseY: 0.95,
    color: '#2c4a47',
    accent: '#b84a39',
    grass: '#b3d4a8',
    vegMapTags: ['簡單美味', '步行易到'],
    travelHint: '校門斜對面步行約 4 分鐘',
    sceneDesc: '暖紅招牌中式麵館，門口紅燈籠高掛，大碗紅燒湯麵與當歸藥膳香氣四溢。',
    lat: 24.79735,
    lng: 120.99795
  },
  '安姆士': {
    id: 'amushi',
    short: '安姆士',
    ring: 'inner',
    badgeNo: 3,
    angleDeg: -66,
    radius: 15.2,
    baseY: 0.45,
    color: '#2c4a47',
    accent: '#3e8e89',
    grass: '#a5d4c4',
    vegMapTags: ['健康美味', '輕食選擇'],
    travelHint: '光復路二段步行約 5 分鐘',
    sceneDesc: '清新薄荷綠輕食茶飲吧，巨型漸層水果奶茶杯與色彩繽紛的養生拌飯。',
    lat: 24.79762,
    lng: 120.99735
  },
  '棗子樹': {
    id: 'zaozishu',
    short: '棗子樹',
    ring: 'inner',
    badgeNo: 4,
    angleDeg: -115,
    radius: 15.2,
    baseY: 0.85,
    color: '#2c4a47',
    accent: '#568c47',
    grass: '#afd49c',
    vegMapTags: ['多元選擇', '老店推薦'],
    travelHint: '建新路步行約 6 分鐘',
    sceneDesc: '結滿紅棗果實的綠意小館，鐵板上正煎著金黃酥香的招牌蛋煎粄條。',
    lat: 24.7984498,
    lng: 120.9970441
  },
  '鼎盛蔬食便當': {
    id: 'dingsheng',
    short: '鼎盛蔬食',
    ring: 'inner',
    badgeNo: 5,
    angleDeg: 138,
    radius: 14.6,
    baseY: 0.35,
    color: '#2c4a47',
    accent: '#6d4c93',
    grass: '#b5d3a4',
    vegMapTags: ['自助餐', '校園必吃'],
    travelHint: '清大校內風雲樓 2 樓',
    sceneDesc: '清大風雲樓二樓圓弧學生餐廳，木質餐檯上排列著多格豐盛手作蔬食便當盒。',
    lat: 24.79185,
    lng: 120.99365
  },
  '滿素圓': {
    id: 'mansuyuan',
    short: '滿素圓',
    ring: 'outer',
    badgeNo: 1,
    angleDeg: 10,
    radius: 25.4,
    baseY: 1.75,
    color: '#ea7a2e',
    accent: '#d96b27',
    grass: '#bed89e',
    vegMapTags: ['家常便當', '紅油抄手'],
    travelHint: '金城一路・單車約 7 分鐘',
    sceneDesc: '將軍村旁溫馨家常小館，暖白瓷碗盛裝著鮮香抄手、酸辣湯與木盒便當。',
    lat: 24.79665,
    lng: 121.00415
  },
  '一鮮素素食小館': {
    id: 'yixiansu',
    short: '一鮮素',
    ring: 'outer',
    badgeNo: 2,
    angleDeg: -90,
    radius: 25.5,
    baseY: 2.2,
    color: '#ea7a2e',
    accent: '#c85328',
    grass: '#c4d89a',
    vegMapTags: ['鐵板素排', '砂鍋臭豆腐'],
    travelHint: '建中一路・單車約 7 分鐘',
    sceneDesc: '人氣熱炒鐵板小館，黑色鑄鐵盤上的素排與陶土砂鍋臭豆腐煲正滋滋冒煙。',
    lat: 24.8005073,
    lng: 120.9939659
  },
  '游媽媽素食小吃': {
    id: 'youmama',
    short: '游媽媽素食',
    ring: 'outer',
    badgeNo: 3,
    angleDeg: -145,
    radius: 25.0,
    baseY: 1.55,
    color: '#ea7a2e',
    accent: '#df7a26',
    grass: '#c8dca4',
    vegMapTags: ['古早味油飯', '全天營業'],
    travelHint: '馬偕對面・單車約 6 分鐘',
    sceneDesc: '親切傳統古早味攤車，竹蒸籠內盛滿油亮素油飯，旁邊擺著飽滿元寶水餃。',
    lat: 24.7995561,
    lng: 120.990976
  },
  '菜根香素食': {
    id: 'caigenxiang',
    short: '菜根香素食',
    ring: 'outer',
    badgeNo: 4,
    angleDeg: 176,
    radius: 25.4,
    baseY: 2.05,
    color: '#ea7a2e',
    accent: '#c95f2e',
    grass: '#b8d69c',
    vegMapTags: ['手工水餃', '大火炒飯'],
    travelHint: '學府路・單車或機車 10 分鐘內',
    sceneDesc: '十八尖山腳下的家常快炒店，中華鐵鍋正翻炒著粒粒分明的金黃招牌炒飯。',
    lat: 24.7961221,
    lng: 120.9821892
  },
  '素怡園(交大二餐二樓素食自助餐)': {
    id: 'suyiyuan',
    short: '素怡園',
    ring: 'outer',
    badgeNo: 5,
    angleDeg: 84,
    radius: 25.2,
    baseY: 1.85,
    color: '#ea7a2e',
    accent: '#d97224',
    grass: '#b6d8a8',
    vegMapTags: ['交大二餐', '秤重自助餐'],
    travelHint: '清交小徑・單車約 8 分鐘',
    sceneDesc: '陽明交大二餐二樓明亮自助餐廳，木桶盛著紫米十穀飯與家常紅燒豆腐。',
    lat: 24.7892431,
    lng: 120.9972309
  }
};

// 中央清華福青主島資料
export const CENTRAL_HUB_ISLAND = {
  id: 'nthu-hub',
  name: '國立清華大學・福青蔬食主島',
  short: '清華大學',
  isHub: true,
  ring: 'hub',
  badgeNo: 0,
  x: 0,
  baseY: 0,
  z: 0,
  radius: 0,
  islandRadius: 5.5,
  color: '#4a8584',
  accent: '#7b4b94',
  grass: '#9ec99c',
  tagLabel: '天空之城核心・簡冊立柱校門',
  tagline: '邀請你出一張嘴，吃蔬食改變世界！從清華簡冊校門出發，探索 10 座雲端蔬食浮島。',
  sceneDesc: '矗立著三柱並列階梯造型的清華大學「簡冊立柱」白色校門，搭配拼花石板廣場、蒼翠榕樹群、微縮成功湖與福青社蔬食月攤位。',
  highlights: [
    '收錄 2026 清大福青蔬食月精選 TOP 10 人氣店家（內環 5 家步行特別推薦 + 外環 5 家單車 10 分鐘生活圈）',
    '即時比對台灣時區星期與營業時間，浮島名牌綠燈直覺顯示目前「營業中」店家',
    '串聯新竹清大即時天氣與日夜四段光影，夜晚自動點亮十座浮島溫暖店鋪燈火',
    '點擊下方「今天吃啥」回答 4 題喜好，立即為你導航至最對味的那一座蔬食浮島'
  ],
  links: [
    { label: '前往九宮格賓果挑戰', href: './index.html', primary: true },
    { label: '開啟完整 Google 蔬食地圖', href: './map.html?view=classic', primary: false }
  ]
};

export const VEG_QUOTES = [
  ['邀請你出一張嘴，吃蔬食改變世界！', '清大蔬食散步地圖'],
  ['一餐無肉蔬食，約可減少 0.78 公斤碳排放，為地球降溫。', '福青蔬食月冷知識'],
  ['從清大校門走到光復路，五分鐘就能遇見一碗暖心的藥膳湯麵。', '清大覓食指南'],
  ['攜帶環保餐盒與環保杯外帶蔬食，還能同步完成賓果卡第 1 格任務！', '集食行善攻略'],
  ['風雲樓二樓鼎盛與交大二餐素怡園，是清交學子最實惠的校園綠洲。', '校園必吃筆記'],
  ['全素清爽、蛋奶素豐富，十座天空浮島總有一座適合今天的胃。', '2026 清大福青社']
];

export const SKY_LINKS = [
  { from: 'nthu-hub', to: 'dingsheng', label: '校內風二必吃' },
  { from: 'nthu-hub', to: 'yasuzhai', label: '過馬路 5 分鐘' },
  { from: 'nthu-hub', to: 'miaoguanyin', label: '紅燒麵散步圈' },
  { from: 'nthu-hub', to: 'amushi', label: '果茶輕食圈' },
  { from: 'nthu-hub', to: 'zaozishu', label: '建新路美食圈' },
  { from: 'dingsheng', to: 'suyiyuan', label: '清交小徑雙校自助餐' },
  { from: 'yasuzhai', to: 'mansuyuan', label: '光復金城單車線' },
  { from: 'amushi', to: 'yixiansu', label: '建功建中單車線' },
  { from: 'zaozishu', to: 'youmama', label: '馬偕古早味單車線' },
  { from: 'youmama', to: 'caigenxiang', label: '學府路十八尖山線' }
];

export const QUIZ_QUESTIONS = [
  {
    q: '今天你的素食飲食偏好是？',
    opts: [
      { label: '全素（純植物無蛋奶，清爽無負擔）', pureOnly: true, weights: { miaoguanyin: 3, youmama: 3, caigenxiang: 3, yasuzhai: 2, dingsheng: 1 } },
      { label: '全素或蛋奶素皆可（多元美味都想試）', pureOnly: false, weights: { yasuzhai: 2, amushi: 2, zaozishu: 2, yixiansu: 2, suyiyuan: 2, mansuyuan: 2, dingsheng: 2 } }
    ]
  },
  {
    q: '這一餐的預算大約落在哪裡？',
    opts: [
      { label: '銅板省錢價（$30 ~ $100 輕鬆解決）', weights: { amushi: 4, youmama: 4, zaozishu: 2, dingsheng: 2, mansuyuan: 2, caigenxiang: 2 } },
      { label: '日常飽足餐（$80 ~ $130 豐盛均衡）', weights: { dingsheng: 3, suyiyuan: 3, zaozishu: 3, caigenxiang: 3, mansuyuan: 3 } },
      { label: '犒賞聚餐級（$100 ~ $200 套餐或藥膳大碗）', weights: { yasuzhai: 4, yixiansu: 4, miaoguanyin: 3, suyiyuan: 2 } }
    ]
  },
  {
    q: '現在你想怎麼移動去覓食？',
    opts: [
      { label: '就在校內或校門對面步行 5 分鐘內', weights: { dingsheng: 4, yasuzhai: 3, miaoguanyin: 3, amushi: 3, zaozishu: 3 } },
      { label: '騎腳踏車或機車兜風 10 分鐘也沒問題', weights: { yixiansu: 3, youmama: 3, caigenxiang: 3, mansuyuan: 3, suyiyuan: 3 } }
    ]
  },
  {
    q: '此時此刻，你最想吃哪一種料理？',
    opts: [
      { label: '濃郁藥膳湯麵、紅燒麵與滷味', weights: { yasuzhai: 4, miaoguanyin: 4, zaozishu: 1 } },
      { label: '多樣配菜自助餐或手作便當', weights: { dingsheng: 5, suyiyuan: 5, mansuyuan: 3 } },
      { label: '手工水餃、古早味油飯、蛋煎粄條或炒飯', weights: { youmama: 4, caigenxiang: 4, zaozishu: 4, mansuyuan: 2 } },
      { label: '滋滋作響的鐵板素排與砂鍋臭豆腐煲', weights: { yixiansu: 6, yasuzhai: 1 } },
      { label: '清爽養生拌飯拌麵配一杯水果奶茶', weights: { amushi: 6 } }
    ]
  }
];

function parsePriceBounds(priceStr) {
  const nums = (priceStr.match(/\d+/g) || []).map(Number);
  if (nums.length >= 2) return { min: nums[0], max: nums[1] };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: 60, max: 120 };
}

function parseCategoryAndDiet(rawCategory) {
  // 清理原始 TSV 第 11 列「中式麵食便當理/蛋奶素」之贅字「理」
  const cleaned = String(rawCategory || '').replace(/便當理/g, '便當').trim();
  const [cuisinePart = '', dietPart = ''] = cleaned.split('/').map(s => s.trim());
  const isPureVegan = dietPart === '全素';
  const hasVeganOption = dietPart.includes('全素');
  const dietDisplay = dietPart === '全素蛋奶素' ? '全素 / 蛋奶素' : (dietPart || '蔬食');
  return {
    categoryClean: `${cuisinePart} / ${dietDisplay}`,
    cuisine: cuisinePart,
    diet: dietDisplay,
    isPureVegan,
    hasVeganOption
  };
}

/**
 * 解析中文星期範圍（週日=0, 週一=1 ... 週六=6）
 */
const DAY_CHAR_MAP = { '日': 0, '天': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 };

function expandDaySpec(spec) {
  const days = new Set();
  const rangeRegex = /週([日天一二三四五六])(?:至|到|~|－|-)週?([日天一二三四五六])/g;
  let match;
  let matchedAny = false;
  while ((match = rangeRegex.exec(spec)) !== null) {
    matchedAny = true;
    const start = DAY_CHAR_MAP[match[1]];
    const end = DAY_CHAR_MAP[match[2]];
    if (start <= end && start !== 0 && end !== 0) {
      for (let d = start; d <= end; d++) days.add(d);
    } else if (start === 6 && end === 0) {
      days.add(6);
      days.add(0);
    } else {
      let cur = start;
      for (let step = 0; step < 7; step++) {
        days.add(cur);
        if (cur === end) break;
        cur = (cur + 1) % 7;
      }
    }
  }
  const singleRegex = /週([日天一二三四五六])/g;
  if (!matchedAny) {
    while ((match = singleRegex.exec(spec)) !== null) {
      days.add(DAY_CHAR_MAP[match[1]]);
    }
  } else {
    // 處理「週六、週日」同時存在或附加單日
    const stripped = spec.replace(rangeRegex, '');
    while ((match = singleRegex.exec(stripped)) !== null) {
      days.add(DAY_CHAR_MAP[match[1]]);
    }
  }
  return days;
}

function extractTimeIntervals(text) {
  const intervals = [];
  // 相容單數分鐘如「11:0–21:00」：若分鐘僅 1 位數且為 0 視為 :00
  const timeRegex = /(\d{1,2}):(\d{1,2})\s*[–—\-~～至]\s*(\d{1,2}):(\d{1,2})/g;
  let m;
  while ((m = timeRegex.exec(text)) !== null) {
    const h1 = Number(m[1]);
    const m1 = m[2].length === 1 ? Number(m[2]) * 10 : Number(m[2]);
    const h2 = Number(m[3]);
    const m2 = m[4].length === 1 ? Number(m[4]) * 10 : Number(m[4]);
    intervals.push([h1 * 60 + m1, h2 * 60 + m2]);
  }
  return intervals;
}

/**
 * 取得台灣時區（Asia/Taipei, UTC+8）之星期與當日分鐘數
 */
export function getTaipeiClock(date = new Date()) {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const taipei = new Date(utcMs + 8 * 3600000);
  return {
    day: taipei.getDay(),
    hours: taipei.getHours(),
    minutes: taipei.getMinutes(),
    totalMinutes: taipei.getHours() * 60 + taipei.getMinutes(),
    month: taipei.getMonth() + 1,
    date: taipei.getDate(),
    weekChar: ['日', '一', '二', '三', '四', '五', '六'][taipei.getDay()],
    timeStr: `${String(taipei.getHours()).padStart(2, '0')}:${String(taipei.getMinutes()).padStart(2, '0')}`
  };
}

/**
 * 根據 TSV 營業時間字串與台灣時間即時判定「營業中 / 休息中 / 今日公休」
 */
export function evaluateOpenStatus(hoursText, date = new Date()) {
  const raw = String(hoursText || '').trim();
  if (!raw) return { state: 'closed', label: '依現場公告', isOpen: false };

  const clock = getTaipeiClock(date);
  const today = clock.day;
  const nowMin = clock.totalMinutes;

  // 1. 檢查括號或分號中之明確「公休」子句
  const holidayMatches = raw.match(/([^；;()（）]*公休)/g) || [];
  for (const clause of holidayMatches) {
    const offDays = expandDaySpec(clause);
    if (offDays.has(today)) {
      return { state: 'holiday', label: '今日公休', isOpen: false };
    }
  }

  // 剝除括號備註後拆分子句（例如分平日與週末）
  const mainBody = raw.replace(/[（(][^）)]*[）)]/g, '').trim();
  const clauses = mainBody.split(/[；;]/).map(s => s.trim()).filter(Boolean);

  let hasDaySpecificClause = false;
  let matchedTodayClause = false;
  let todayIntervals = [];

  for (const clause of clauses) {
    if (/公休/.test(clause)) continue;
    const days = expandDaySpec(clause);
    const intervals = extractTimeIntervals(clause);
    if (days.size > 0) {
      hasDaySpecificClause = true;
      if (days.has(today)) {
        matchedTodayClause = true;
        todayIntervals.push(...intervals);
      }
    } else if (intervals.length > 0) {
      todayIntervals.push(...intervals);
    }
  }

  // 若全部子句皆限定星期（例如滿素圓「週一至週五：11:00–14:00, 17:00–20:00」），且今日不在範圍內 -> 今日公休
  if (hasDaySpecificClause && !matchedTodayClause && todayIntervals.length === 0) {
    return { state: 'holiday', label: '今日公休', isOpen: false };
  }

  for (const [start, end] of todayIntervals) {
    if (nowMin >= start && nowMin < end) {
      const remain = end - nowMin;
      const hint = remain <= 30 ? `營業中（${remain} 分鐘後打烊）` : '營業中';
      return { state: 'open', label: hint, isOpen: true };
    }
  }

  // 找出今日下一個即將開始的營業時段
  const upcoming = todayIntervals.filter(([start]) => start > nowMin).sort((a, b) => a[0] - b[0]);
  if (upcoming.length > 0) {
    const nextStart = upcoming[0][0];
    const hh = String(Math.floor(nextStart / 60)).padStart(2, '0');
    const mm = String(nextStart % 60).padStart(2, '0');
    return { state: 'closed', label: `休息中（${hh}:${mm} 開店）`, isOpen: false };
  }

  return { state: 'closed', label: '今日已打烊', isOpen: false };
}

/**
 * 將 TSV 純文字轉換為結構化浮島店家陣列（支援 UTF-8 BOM 剝除與 CRLF 清洗）
 */
export function parseRestaurantsTSV(tsvText) {
  const cleanText = String(tsvText || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  const lines = cleanText.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const name = (cols[0] || '').trim();
    if (!name) continue;

    const address = (cols[1] || '').trim();
    const dishesRaw = (cols[2] || '').trim();
    const price = (cols[3] || '').trim();
    const categoryRaw = (cols[4] || '').trim();
    const hoursRaw = (cols[5] || '').trim();
    // 修正原始資料「11:0–21:00」顯示為「11:00–21:00」以利閱讀
    const hoursDisplay = hoursRaw.replace(/(\d{1,2}):0(?=[–—\-~～至])/g, '$1:00');
    const phone = (cols[6] || '').trim();
    const featuredCol = (cols[7] || '').trim();
    const bikeCol = (cols[8] || '').trim();
    const note = (cols[9] || '').trim();

    const meta = SHOP_SPATIAL_META[name] || {
      id: `shop-${i}`,
      short: name.slice(0, 5),
      ring: featuredCol ? 'inner' : 'outer',
      badgeNo: i,
      angleDeg: (i - 1) * 36,
      radius: featuredCol ? 15.2 : 25.2,
      baseY: featuredCol ? 0.6 : 1.8,
      color: featuredCol ? '#2c4a47' : '#ea7a2e',
      accent: '#4a8584',
      grass: '#b2d4a4',
      vegMapTags: ['福青推薦'],
      travelHint: '清大生活圈',
      sceneDesc: `${name}微縮蔬食浮島。`
    };

    const rad = (meta.angleDeg * Math.PI) / 180;
    const x = Number((Math.cos(rad) * meta.radius).toFixed(3));
    const z = Number((Math.sin(rad) * meta.radius).toFixed(3));

    const dishes = dishesRaw
      .split(/[、,，]/)
      .map(d => d.trim())
      .filter(Boolean);

    const catInfo = parseCategoryAndDiet(categoryRaw);
    const priceBounds = parsePriceBounds(price);
    const isFeatured = Boolean(featuredCol);
    const rawGroupBadge = (featuredCol || bikeCol).replace(/^✔\s*/, '').replace(/^[（(]|[）)]$/g, '');

    const primaryPhone = phone.split(/[；;]/)[0].replace(/[^\d\-]/g, '');
    const mapsQuery = encodeURIComponent(`${name} ${address.replace(/（.*?）/g, '')}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    records.push({
      id: meta.id,
      index: i,
      name,
      short: meta.short,
      address,
      dishesRaw,
      dishes,
      price,
      priceMin: priceBounds.min,
      priceMax: priceBounds.max,
      categoryRaw,
      ...catInfo,
      hoursRaw,
      hoursDisplay,
      phone,
      telHref: primaryPhone ? `tel:${primaryPhone}` : null,
      featuredCol,
      bikeCol,
      isFeatured,
      groupBadge: rawGroupBadge || (meta.ring === 'inner' ? '清大周邊' : '腳踏車 10 分鐘可達'),
      tagLabel: meta.ring === 'inner'
        ? `推薦前五名 #${meta.badgeNo}・${rawGroupBadge}`
        : `單車生活圈 #${meta.badgeNo}・${rawGroupBadge}`,
      note,
      ring: meta.ring,
      badgeNo: meta.badgeNo,
      angleDeg: meta.angleDeg,
      radius: meta.radius,
      islandRadius: meta.ring === 'inner' ? 3.85 : 3.65,
      x,
      baseY: meta.baseY,
      z,
      color: meta.color,
      accent: meta.accent,
      grass: meta.grass,
      vegMapTags: meta.vegMapTags,
      travelHint: meta.travelHint,
      sceneDesc: meta.sceneDesc,
      lat: meta.lat,
      lng: meta.lng,
      mapsUrl
    });
  }

  // 排序：內環特別推薦 #1~#5 優先，接著外環單車 10 分鐘 #1~#5（完全對齊 VEG_MAP.jpg 編號）
  records.sort((a, b) => {
    if (a.ring !== b.ring) return a.ring === 'inner' ? -1 : 1;
    return a.badgeNo - b.badgeNo;
  });

  return records;
}

/**
 * 動態讀取 TSV（明確指定 UTF-8 TextDecoder 防止編碼錯亂；若處於 file:// 離線環境則無縫降級至內建備援）
 */
export async function loadIslandDataset(tsvUrl = './about/2026%E8%94%AC%E9%A3%9F%E6%8E%A8%E8%96%A6%E9%A4%90%E5%BB%B3TOP10.tsv') {
  let tsvText = RAW_TSV_FALLBACK;
  let source = 'fallback';
  if (typeof fetch === 'function') {
    try {
      const resp = await fetch(tsvUrl, { cache: 'no-cache' });
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        const decoded = new TextDecoder('utf-8').decode(buf);
        if (decoded && decoded.includes('雅素齋')) {
          tsvText = decoded;
          source = 'tsv-fetch';
        }
      }
    } catch {
      // shortcut: file:// 協定阻擋 fetch 時自動回退至與 TSV 逐字同步之 RAW_TSV_FALLBACK
    }
  }
  const shops = parseRestaurantsTSV(tsvText);
  const allIslands = [CENTRAL_HUB_ISLAND, ...shops];
  const byId = Object.fromEntries(allIslands.map(item => [item.id, item]));
  return { source, hub: CENTRAL_HUB_ISLAND, shops, allIslands, byId };
}

/**
 * 計算「今天吃什麼？」尋味適性測驗分數與推薦排序
 */
export function scoreQuizRecommendations(optionIndices, shops) {
  const scores = Object.fromEntries(shops.map(s => [s.id, 1]));
  let requirePureVegan = false;

  optionIndices.forEach((optIdx, qIdx) => {
    const q = QUIZ_QUESTIONS[qIdx];
    const opt = q?.opts?.[optIdx];
    if (!opt) return;
    if (opt.pureOnly) requirePureVegan = true;
    for (const [shopId, w] of Object.entries(opt.weights || {})) {
      if (scores[shopId] !== undefined) scores[shopId] += w;
    }
  });

  let candidates = shops.filter(s => (requirePureVegan ? s.hasVeganOption : true));
  if (candidates.length === 0) candidates = shops;

  const maxScore = Math.max(1, ...candidates.map(s => scores[s.id]));
  return candidates
    .map(shop => ({
      shop,
      score: scores[shop.id],
      matchPct: Math.min(99, Math.max(62, Math.round((scores[shop.id] / maxScore) * 98)))
    }))
    .sort((a, b) => b.score - a.score || (a.shop.ring === 'inner' ? -1 : 1));
}

/**
 * 啟動資料完整性與即時營業狀態斷言檢核
 */
export function verifyIslandDataIntegrity() {
  const shops = parseRestaurantsTSV('\uFEFF' + RAW_TSV_FALLBACK);
  if (shops.length !== 10) {
    throw new Error(`Expected 10 restaurants from TSV, got ${shops.length}`);
  }
  const innerCount = shops.filter(s => s.ring === 'inner').length;
  const outerCount = shops.filter(s => s.ring === 'outer').length;
  if (innerCount !== 5 || outerCount !== 5) {
    throw new Error(`Ring split mismatch: inner=${innerCount}, outer=${outerCount}`);
  }
  const mansuyuan = shops.find(s => s.id === 'mansuyuan');
  if (!mansuyuan || mansuyuan.categoryClean.includes('便當理')) {
    throw new Error('Failed to clean typo 便當理 in 滿素圓 category');
  }
  // 驗證營業狀態解析：雅素齋週一公休、週三 18:30 營業中、週三 15:00 休息中
  const yasuzhai = shops.find(s => s.id === 'yasuzhai');
  const mon = evaluateOpenStatus(yasuzhai.hoursRaw, new Date('2026-10-26T12:30:00+08:00')); // Monday
  const wedOpen = evaluateOpenStatus(yasuzhai.hoursRaw, new Date('2026-10-28T18:30:00+08:00')); // Wednesday
  const wedBreak = evaluateOpenStatus(yasuzhai.hoursRaw, new Date('2026-10-28T15:00:00+08:00')); // Wednesday afternoon
  if (mon.state !== 'holiday' || !wedOpen.isOpen || wedBreak.isOpen) {
    throw new Error(`Business hours parser check failed: mon=${mon.state}, wedOpen=${wedOpen.state}, wedBreak=${wedBreak.state}`);
  }
  return { ok: true, count: shops.length, innerCount, outerCount };
}
