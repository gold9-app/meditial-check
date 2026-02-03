// --- Nickname & Birthday ---
function initNickname() {
  const nickname = localStorage.getItem('supp_nickname');
  if (!nickname) {
    document.getElementById('welcomeOverlay').style.display = 'flex';
  } else {
    displayNickname(nickname);
    displayBirthday();
  }
}

function displayNickname(name) {
  document.getElementById('nicknameDisplay').textContent = name + '님';
  document.getElementById('nicknameValue').textContent = name;
}

function displayBirthday() {
  const birthday = localStorage.getItem('supp_birthday');
  const el = document.getElementById('birthdayValue');
  if (el) {
    el.textContent = birthday ? birthday : '미설정';
  }
}

function saveNickname() {
  const input = document.getElementById('nicknameInput');
  const name = input.value.trim();
  if (!name) {
    input.focus();
    return;
  }
  localStorage.setItem('supp_nickname', name);
  const birthdayInput = document.getElementById('birthdayInput');
  if (birthdayInput && birthdayInput.value) {
    localStorage.setItem('supp_birthday', birthdayInput.value);
  }
  displayNickname(name);
  displayBirthday();
  const overlay = document.getElementById('welcomeOverlay');
  overlay.classList.add('fade-out');
  setTimeout(() => { overlay.style.display = 'none'; }, 400);
}

function promptNicknameChange() {
  const current = localStorage.getItem('supp_nickname') || '';
  const newName = prompt('새 닉네임을 입력하세요:', current);
  if (newName !== null && newName.trim()) {
    localStorage.setItem('supp_nickname', newName.trim());
    displayNickname(newName.trim());
  }
}

function promptBirthdayChange() {
  const current = localStorage.getItem('supp_birthday') || '';
  const newBirthday = prompt('생일을 입력하세요 (YYYY-MM-DD):', current);
  if (newBirthday !== null && newBirthday.trim()) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(newBirthday.trim())) {
      localStorage.setItem('supp_birthday', newBirthday.trim());
      displayBirthday();
    } else {
      alert('올바른 형식으로 입력해주세요 (예: 1990-01-15)');
    }
  }
}

// --- Reset ---
function resetApp() {
  if (!confirm('모든 데이터가 삭제되고 초기 상태로 돌아갑니다.\n정말 초기화하시겠습니까?')) return;
  if (!confirm('되돌릴 수 없습니다. 계속하시겠습니까?')) return;
  const keys = [STORAGE_KEY, RECORDS_KEY, BADGES_KEY, CHECK_TIMES_KEY, BADGE_REWARDS_KEY, 'supp_nickname', 'supp_birthday', 'supp_stock_log', 'darkMode'];
  keys.forEach(k => localStorage.removeItem(k));
  location.reload();
}

// --- PWA Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function() {});
}

// --- Init ---
initNickname();
checkNotifPermission();
renderToday();
