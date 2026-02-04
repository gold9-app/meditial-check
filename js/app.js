// --- Nickname & Birthday ---
function initNickname() {
  const nickname = localStorage.getItem('supp_nickname');
  if (!nickname) {
    document.getElementById('welcomeOverlay').style.display = 'flex';
    document.querySelector('.bottom-nav').style.display = 'none';
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
  const birthdayInput = document.getElementById('birthdayInput');
  if (!birthdayInput || !birthdayInput.value) {
    birthdayInput.focus();
    return;
  }
  localStorage.setItem('supp_nickname', name);
  localStorage.setItem('supp_birthday', birthdayInput.value);
  displayNickname(name);
  displayBirthday();
  const overlay = document.getElementById('welcomeOverlay');
  overlay.classList.add('fade-out');
  document.querySelector('.bottom-nav').style.display = '';
  setTimeout(() => { overlay.style.display = 'none'; }, 400);
}

function promptNicknameChange() {
  const current = localStorage.getItem('supp_nickname') || '';
  const newName = prompt('새 이름을 입력하세요:', current);
  if (newName !== null && newName.trim()) {
    localStorage.setItem('supp_nickname', newName.trim());
    displayNickname(newName.trim());
  }
}

// --- Reset ---
function resetApp() {
  if (!confirm('모든 데이터가 삭제되고 초기 상태로 돌아갑니다.\n정말 초기화하시겠습니까?')) return;
  if (!confirm('되돌릴 수 없습니다. 계속하시겠습니까?')) return;
  const keys = [STORAGE_KEY, RECORDS_KEY, BADGES_KEY, CHECK_TIMES_KEY, BADGE_REWARDS_KEY, CHALLENGE_KEY, 'supp_nickname', 'supp_birthday', 'supp_stock_log', 'darkMode'];
  keys.forEach(k => localStorage.removeItem(k));
  location.reload();
}

// --- PWA Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    // 이미 대기 중인 새 SW가 있으면 바로 배너 표시
    if (reg.waiting && navigator.serviceWorker.controller) {
      document.getElementById('updateBanner').style.display = 'flex';
    }
    reg.onupdatefound = () => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.onstatechange = () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          document.getElementById('updateBanner').style.display = 'flex';
        }
      };
    };
  }).catch(() => {});
  // 새 SW가 제어권을 가져갈 때 배너 표시
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) {
      document.getElementById('updateBanner').style.display = 'flex';
    }
    hadController = true;
  });
}

// --- PWA Install Banner ---
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (!sessionStorage.getItem('installBannerDismissed')) {
    document.getElementById('installBannerAndroid').style.display = 'block';
  }
});

document.getElementById('installBtn').addEventListener('click', () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    document.getElementById('installBannerAndroid').style.display = 'none';
  });
});

document.getElementById('installDismissAndroid').addEventListener('click', () => {
  document.getElementById('installBannerAndroid').style.display = 'none';
  sessionStorage.setItem('installBannerDismissed', '1');
});

document.getElementById('installDismissIOS').addEventListener('click', () => {
  document.getElementById('installBannerIOS').style.display = 'none';
  sessionStorage.setItem('installBannerDismissed', '1');
});

// --- In-App Browser Detection ---
function isInAppBrowser() {
  const ua = navigator.userAgent || '';
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER|Snapchat/i.test(ua);
}

document.getElementById('installDismissInApp').addEventListener('click', () => {
  document.getElementById('installBannerInApp').style.display = 'none';
  sessionStorage.setItem('installBannerDismissed', '1');
});

document.getElementById('openSafariBtn').addEventListener('click', () => {
  const currentURL = location.href;
  const ua = navigator.userAgent || '';

  if (/KAKAOTALK/i.test(ua)) {
    // 카카오톡: 외부 브라우저 열기 스킴
    location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(currentURL);
  } else {
    // 기타 인앱 브라우저: 새 창으로 시도
    window.open(currentURL, '_blank');
  }
});

// iOS detection: show guide banner if not standalone and not already dismissed
(function checkIOSInstallBanner() {
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (isIOS && !isStandalone && !sessionStorage.getItem('installBannerDismissed')) {
    if (isInAppBrowser()) {
      // 인앱 브라우저 → Safari 열기 안내
      document.getElementById('installBannerInApp').style.display = 'block';
    } else {
      // Safari → 홈 화면에 추가 안내
      document.getElementById('installBannerIOS').style.display = 'block';
    }
  }
})();

window.addEventListener('appinstalled', () => {
  document.getElementById('installBannerAndroid').style.display = 'none';
  deferredPrompt = null;
});

// --- Init ---
initNickname();
checkNotifPermission();
renderToday();
