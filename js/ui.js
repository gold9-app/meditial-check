// --- Dark Mode ---
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('darkIcon').textContent = '☀️';
  }
}
function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('darkIcon').textContent = '🌙';
    localStorage.setItem('darkMode', 'false');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('darkIcon').textContent = '☀️';
    localStorage.setItem('darkMode', 'true');
  }
  renderToday();
  if (document.getElementById('stats').classList.contains('active')) renderStats();
  if (document.getElementById('manage').classList.contains('active')) renderManage();
}
initDarkMode();

// --- Confetti Effect ---
function fireConfetti(x, y) {
  const container = document.getElementById('confettiContainer');
  const colors = ['#2563eb','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4'];
  for (let i = 0; i < 20; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
    piece.style.top = (y - 10) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (6 + Math.random() * 6) + 'px';
    piece.style.height = (6 + Math.random() * 6) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
    piece.style.animationDelay = (Math.random() * 0.2) + 's';
    const angle = (Math.random() - 0.5) * 120;
    piece.style.setProperty('--spread', angle + 'deg');
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 1600);
  }
}

function fireBigConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#2563eb','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'];
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = (Math.random() * window.innerWidth) + 'px';
    piece.style.top = (-20 - Math.random() * 40) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (8 + Math.random() * 8) + 'px';
    piece.style.height = (8 + Math.random() * 8) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = (1 + Math.random() * 1.5) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 2500);
  }
}

// --- Haptic Feedback ---
function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern || 30);
  }
}

// --- Care Messages ---
const CARE_DONE = [
  '오늘은 이미 충분히 잘하고 있어요.',
  '오늘의 할 일, 가장 중요한 건 끝났어요.',
  '몸이 분명히 기억할 거예요.',
  '작은 습관이 오늘도 지켜졌어요.',
  '오늘 하루, 나를 챙긴 기록이 하나 남았어요.',
  '오늘도 스스로와의 약속을 지켰네요.',
  '이게 쌓이면, 달라집니다.',
  '오늘의 선택이 내일의 컨디션을 만듭니다.',
  '쉬워 보이지만, 아무나 못 하는 일.',
  '계속 가고 있다는 게 중요해요.',
  '오늘도 애쓰셨죠. 충분해요.',
  '오늘 하루, 이 정도면 잘한 거예요.',
  '나를 챙기는 사람은 늘 바쁜 사람입니다.',
  '완벽하지 않아도, 계속하는 게 멋져요.',
  '오늘은 스스로에게 점수 주셔도 돼요.',
  '오늘의 건강 루틴, 깔끔하게 완료.',
  '메디셜이 함께한 오늘의 기록.',
  '오늘의 체크 하나가 내일을 바꿉니다.',
  '건강은 이렇게 쌓입니다.',
  '오늘도 좋은 선택을 하셨어요.',
];
const CARE_NOT_DONE = [
  '아직 하루는 남아 있어요.',
  '오늘은 아직 끝나지 않았어요.',
  '지금 생각났다면, 딱 좋은 타이밍이에요.',
  '괜찮아요. 천천히 가도 돼요.',
  '오늘 한 번 더 기회가 있어요.',
  '바쁜 날엔 누구나 놓칠 수 있어요.',
  '오늘이 유난히 정신없었죠?',
  '깜빡해도 괜찮아요.',
  '건강은 완벽함보다 방향이에요.',
  '오늘도 애쓴 하루였어요.',
];

function getDailyRandom(arr, seed) {
  const key = todayKey();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash) + key.charCodeAt(i);
  hash = ((hash << 5) - hash) + seed;
  return arr[Math.abs(hash) % arr.length];
}

// --- Bottom Navigation ---
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(item.dataset.tab).classList.add('active');
    if (item.dataset.tab === 'stats') renderStats();
    if (item.dataset.tab === 'manage') renderManage();
    if (item.dataset.tab === 'today') { selectedDate = new Date(); renderToday(); }
  });
});

// --- Event Sub-tabs ---
document.querySelectorAll('.event-sub-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.event-sub-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.event-sub-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.sub).classList.add('active');
  });
});

function switchToManage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('.nav-item[data-tab="manage"]').classList.add('active');
  document.getElementById('manage').classList.add('active');
  renderManage();
}

// --- Event Detail ---
function openEventDetail() {
  document.getElementById('eventDetailOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeEventDetail() {
  document.getElementById('eventDetailOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// --- Repurchase Popup ---
function showRepurchasePopup(name) {
  document.getElementById('repurchaseName').textContent = name;
  document.getElementById('repurchasePopup').classList.add('active');
}
function closeRepurchasePopup() {
  document.getElementById('repurchasePopup').classList.remove('active');
}

// --- Event Ticker ---
(function() {
  const items = document.querySelectorAll('.event-ticker-item');
  if (items.length < 2) return;
  let current = 0;
  items[0].classList.add('active');
  setInterval(() => {
    items[current].classList.remove('active');
    items[current].classList.add('out');
    setTimeout(() => items[current].classList.remove('out'), 400);
    current = (current + 1) % items.length;
    items[current].classList.add('active');
  }, 3000);
})();

// --- Guide Toggle ---
function toggleGuide(btn) {
  btn.classList.toggle('open');
  document.getElementById('guideBody').classList.toggle('open');
}
