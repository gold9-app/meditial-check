// --- Global Error Handler ---
window.onerror = function(msg, src, line, col, err) {
  console.error('Global error:', msg, src, line, col, err);
};
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled rejection:', e.reason);
});

// --- Supplement Colors ---
const SUPP_COLORS = {
  '블러드싸이클': { bg: '#fef2f2', border: '#fca5a5', bar: '#ef4444', text: '#dc2626' },
  '헬리컷':       { bg: '#f0fdf4', border: '#86efac', bar: '#22c55e', text: '#16a34a' },
  '판토오틴':     { bg: '#eff6ff', border: '#93c5fd', bar: '#3b82f6', text: '#2563eb' },
  '퓨어톤부스트':   { bg: '#fdf2f8', border: '#f9a8d4', bar: '#ec4899', text: '#db2777' },
  '멜라토닌':     { bg: '#f5f3ff', border: '#c4b5fd', bar: '#8b5cf6', text: '#7c3aed' },
  '글루코컷 혈당케어':       { bg: '#f7fee7', border: '#bef264', bar: '#84cc16', text: '#65a30d' },
  '활성엽산':     { bg: '#f3f0ff', border: '#d8b4fe', bar: '#a78bfa', text: '#8b5cf6' },
  '상어연골환':   { bg: '#faf5ff', border: '#e9d5ff', bar: '#c084fc', text: '#a855f7' },
};
const SUPP_COLORS_DARK = {
  '블러드싸이클': { bg: 'rgba(239,68,68,0.1)', border: 'rgba(252,165,165,0.3)', bar: '#f87171', text: '#fca5a5' },
  '헬리컷':       { bg: 'rgba(34,197,94,0.1)', border: 'rgba(134,239,172,0.3)', bar: '#4ade80', text: '#86efac' },
  '판토오틴':     { bg: 'rgba(59,130,246,0.1)', border: 'rgba(147,197,253,0.3)', bar: '#60a5fa', text: '#93c5fd' },
  '퓨어톤부스트':   { bg: 'rgba(236,72,153,0.1)', border: 'rgba(249,168,212,0.3)', bar: '#f472b6', text: '#f9a8d4' },
  '멜라토닌':     { bg: 'rgba(139,92,246,0.1)', border: 'rgba(196,181,253,0.3)', bar: '#a78bfa', text: '#c4b5fd' },
  '글루코컷 혈당케어':       { bg: 'rgba(132,204,22,0.1)', border: 'rgba(190,242,100,0.3)', bar: '#a3e635', text: '#bef264' },
  '활성엽산':     { bg: 'rgba(167,139,250,0.1)', border: 'rgba(216,180,254,0.3)', bar: '#c084fc', text: '#d8b4fe' },
  '상어연골환':   { bg: 'rgba(192,132,252,0.1)', border: 'rgba(233,213,255,0.3)', bar: '#d8b4fe', text: '#e9d5ff' },
};
const SUPP_URLS = {
  '블러드싸이클': 'https://meditial.co.kr/product/detail.html?product_no=26&cafe_mkt=ue_MAPP_BC',
  '헬리컷':       'https://meditial.co.kr/product/detail.html?product_no=63&cafe_mkt=ue_MAPP_HC',
  '판토오틴':     'https://meditial.co.kr/product/detail.html?product_no=25&cafe_mkt=ue_MAPP_PT',
  '퓨어톤부스트':   'https://meditial.co.kr/product/detail.html?product_no=38&cafe_mkt=ue_MAPP_GT',
  '멜라토닌':     'https://meditial.co.kr/product/detail.html?product_no=66&cafe_mkt=ue_MAPP_MT',
  '글루코컷 혈당케어':       'https://meditial.co.kr/product/detail.html?product_no=52&cafe_mkt=ue_MAPP_GC',
  '활성엽산':     'https://meditial.co.kr/product/detail.html?product_no=62&cafe_mkt=ue_MAPP_PF',
  '상어연골환':   'https://meditial.co.kr/product/detail.html?product_no=25&cafe_mkt=ue_MAPP_PT',
};
function getSuppUrl(name) {
  return SUPP_URLS[name] || 'https://meditial.co.kr/';
}

function getSuppColor(name) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const palette = isDark ? SUPP_COLORS_DARK : SUPP_COLORS;
  return palette[name] || (isDark
    ? { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', bar: '#94a3b8', text: '#cbd5e1' }
    : { bg: '#f8fafc', border: '#e2e8f0', bar: '#94a3b8', text: '#64748b' });
}

// --- Data ---
const STORAGE_KEY = 'supp_data';
const RECORDS_KEY = 'supp_records';

function loadSupplements() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch(e) { console.error('loadSupplements parse error', e); return []; }
}
function saveSupplements(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function loadRecords() {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}'); }
  catch(e) { console.error('loadRecords parse error', e); return {}; }
}
function saveRecords(rec) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(rec));
}

function dateToKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function todayKey() {
  return dateToKey(new Date());
}

function formatDate(d) {
  const days = ['일','월','화','수','목','금','토'];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

// --- Selected Date ---
let selectedDate = new Date();

function selectedDateKey() {
  return dateToKey(selectedDate);
}

// --- Streak Calculation ---
function calculateStreak() {
  const list = loadSupplements();
  if (list.length === 0) return 0;
  const records = loadRecords();
  let streak = 0;
  const d = new Date();

  const todayK = todayKey();
  const todayRec = records[todayK] || [];
  const todayDone = list.every(s => todayRec.includes(s.id));

  if (!todayDone) {
    d.setDate(d.getDate() - 1);
  }

  for (let i = 0; i < 730; i++) {
    const dk = dateToKey(d);
    const dayRec = records[dk] || [];
    if (list.every(s => dayRec.includes(s.id))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function isSelectedToday() {
  return selectedDateKey() === todayKey();
}

// --- Escape HTML ---
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// --- Coupon System ---
const COUPONS_KEY = 'supp_coupons';
const COUPON_GOAL = 5000;

// 쿠폰 시리얼 넘버 목록 (순서대로 발급)
const COUPON_SERIALS = [
  '6LEG5A5C70',  // 첫번째 쿠폰
  '',            // 두번째 쿠폰 (추후 입력)
  '',            // 세번째 쿠폰
  '',            // 네번째 쿠폰
  ''             // 다섯번째 쿠폰
];

function loadCoupons() {
  try { return JSON.parse(localStorage.getItem(COUPONS_KEY) || '[]'); }
  catch(e) { console.error('loadCoupons parse error', e); return []; }
}

function saveCoupons(list) {
  localStorage.setItem(COUPONS_KEY, JSON.stringify(list));
}

function getCouponCount() {
  return loadCoupons().length;
}

function createCoupon() {
  const coupons = loadCoupons();
  const couponNum = coupons.length + 1;
  const serial = COUPON_SERIALS[coupons.length] || '';

  const newCoupon = {
    id: couponNum,
    name: `목표 달성 ${couponNum === 1 ? '첫번째' : couponNum === 2 ? '두번째' : couponNum === 3 ? '세번째' : couponNum === 4 ? '네번째' : couponNum + '번째'} 쿠폰`,
    serial: serial,
    createdAt: todayKey()
  };

  coupons.push(newCoupon);
  saveCoupons(coupons);

  return newCoupon;
}
