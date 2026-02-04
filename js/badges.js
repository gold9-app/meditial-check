// --- Badge / Achievement System ---
const BADGES_KEY = 'supp_badges';
const CHECK_TIMES_KEY = 'supp_check_times';
const BADGE_REWARDS_KEY = 'supp_badge_rewards';

const BADGES = [
  // 연속 복용
  { id: 'first_step', icon: '👣', name: '첫 걸음', desc: '첫 복용 체크', category: '연속 복용',
    check: () => getTotalChecks() >= 1 },
  { id: 'streak_3', icon: '🌱', name: '3일 연속', desc: '3일 연속 전체 복용', category: '연속 복용',
    check: () => calculateStreak() >= 3 },
  { id: 'perfect_week', icon: '⭐', name: '퍼펙트 위크', desc: '7일 연속 전체 복용', category: '연속 복용',
    check: () => calculateStreak() >= 7 },
  { id: 'two_week', icon: '🏃', name: '2주 마라톤', desc: '14일 연속 전체 복용', category: '연속 복용',
    check: () => calculateStreak() >= 14 },
  { id: 'perfect_month', icon: '🏆', name: '퍼펙트 먼스', desc: '30일 연속 전체 복용', category: '연속 복용',
    check: () => calculateStreak() >= 30 },
  { id: 'streak_50', icon: '🏅', name: '50일 연속', desc: '50일 연속 전체 복용', category: '연속 복용',
    check: () => calculateStreak() >= 50 },
  { id: 'ironman', icon: '💎', name: '철인', desc: '100일 연속 전체 복용', category: '연속 복용',
    check: () => calculateStreak() >= 100 },
  { id: 'streak_200', icon: '💫', name: '200일 연속', desc: '200일 연속 전체 복용', category: '연속 복용',
    check: () => calculateStreak() >= 200 },
  { id: 'year_master', icon: '👑', name: '1년 마스터', desc: '365일 연속 전체 복용', category: '연속 복용',
    check: () => calculateStreak() >= 365 },

  // 누적 복용
  { id: 'total_10', icon: '💊', name: '10알 돌파', desc: '총 10회 복용 체크', category: '누적 복용',
    check: () => getTotalChecks() >= 10 },
  { id: 'total_50', icon: '💉', name: '50알 돌파', desc: '총 50회 복용 체크', category: '누적 복용',
    check: () => getTotalChecks() >= 50 },
  { id: 'total_100', icon: '💪', name: '100알 클럽', desc: '총 100회 복용 체크', category: '누적 복용',
    check: () => getTotalChecks() >= 100 },
  { id: 'total_500', icon: '🛡️', name: '500알 전사', desc: '총 500회 복용 체크', category: '누적 복용',
    check: () => getTotalChecks() >= 500 },
  { id: 'total_1000', icon: '🔱', name: '1000알 전설', desc: '총 1000회 복용 체크', category: '누적 복용',
    check: () => getTotalChecks() >= 1000 },
  { id: 'total_2000', icon: '⚔️', name: '2000알 용사', desc: '총 2000회 복용 체크', category: '누적 복용',
    check: () => getTotalChecks() >= 2000 },
  { id: 'total_5000', icon: '🏰', name: '5000알 왕', desc: '총 5000회 복용 체크', category: '누적 복용',
    check: () => getTotalChecks() >= 5000 },

  // 특수 업적
  { id: 'early_bird', icon: '🐤', name: '얼리버드', desc: '오전 7시 이전에 체크', category: '특수 업적',
    check: () => hasCheckBefore7() },
  { id: 'night_owl', icon: '🦉', name: '올빼미', desc: '밤 10시 이후에 체크', category: '특수 업적',
    check: () => hasCheckAfter22() },
  { id: 'full_manager', icon: '📋', name: '풀 관리자', desc: '5종 이상 영양제 등록', category: '특수 업적',
    check: () => loadSupplements().length >= 5 },
  { id: 'health_mania', icon: '🧬', name: '건강 매니아', desc: '8종 이상 영양제 등록', category: '특수 업적',
    check: () => loadSupplements().length >= 8 },
  { id: 'consistency', icon: '📈', name: '꾸준함의 힘', desc: '최근 30일 복용률 90% 이상', category: '특수 업적',
    check: () => getLast30DaysRate() >= 90 },
  { id: 'all_kill', icon: '💥', name: '올킬', desc: '3종 이상 등록 후 하루 전체 복용', category: '특수 업적',
    check: () => hasAllKill() },
  { id: 'birthday_check', icon: '🎂', name: '생일 복용', desc: '내 생일에 전체 복용', category: '특수 업적',
    check: () => hasBirthdayFull() },

  // 시간대 업적
  { id: 'monday_miracle', icon: '🌟', name: '월요일의 기적', desc: '월요일 5번 전체 복용', category: '시간대 업적',
    check: () => getMondayFullCount() >= 5 },
  { id: 'no_weekend_off', icon: '🗓️', name: '주말도 쉬지 않아', desc: '주말 포함 7일 연속 전체 복용', category: '시간대 업적',
    check: () => hasWeekendStreak7() },
  { id: 'new_year', icon: '🎊', name: '새해 결심', desc: '1월 1일 전체 복용', category: '시간대 업적',
    check: () => hasNewYearFull() },

  // 특수 업적 - 챌린지
  { id: 'challenge_3month', icon: '🏅', name: '작심삼월 마스터', desc: '3개월 챌린지 70% 달성', category: '특수 업적',
    check: () => {
      try { const ch = JSON.parse(localStorage.getItem('supp_challenge') || 'null'); return ch && ch.completed; }
      catch(e) { return false; }
    }
  },
];

function loadBadges() {
  try { return JSON.parse(localStorage.getItem(BADGES_KEY) || '{}'); }
  catch(e) { console.error('loadBadges parse error', e); return {}; }
}
function saveBadges(b) {
  localStorage.setItem(BADGES_KEY, JSON.stringify(b));
}
function loadCheckTimes() {
  try { return JSON.parse(localStorage.getItem(CHECK_TIMES_KEY) || '{}'); }
  catch(e) { console.error('loadCheckTimes parse error', e); return {}; }
}
function saveCheckTimes(ct) {
  localStorage.setItem(CHECK_TIMES_KEY, JSON.stringify(ct));
}
function loadBadgeRewards() {
  try { return JSON.parse(localStorage.getItem(BADGE_REWARDS_KEY) || '[]'); }
  catch(e) { console.error('loadBadgeRewards parse error', e); return []; }
}
function saveBadgeRewards(arr) {
  localStorage.setItem(BADGE_REWARDS_KEY, JSON.stringify(arr));
}

function getTotalChecks() {
  const records = loadRecords();
  let total = 0;
  Object.values(records).forEach(arr => { total += arr.length; });
  return total;
}

function getLast30DaysRate() {
  const list = loadSupplements();
  if (list.length === 0) return 0;
  const records = loadRecords();
  let possible = 0, taken = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = dateToKey(d);
    const dayRec = records[dk] || [];
    list.forEach(s => {
      possible++;
      if (dayRec.includes(s.id)) taken++;
    });
  }
  return possible > 0 ? Math.round(taken / possible * 100) : 0;
}

function getMondayFullCount() {
  const list = loadSupplements();
  if (list.length === 0) return 0;
  const records = loadRecords();
  let count = 0;
  Object.keys(records).forEach(dk => {
    const parts = dk.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (d.getDay() === 1) { // Monday
      const dayRec = records[dk] || [];
      if (list.every(s => dayRec.includes(s.id))) count++;
    }
  });
  return count;
}

function hasWeekendStreak7() {
  const streak = calculateStreak();
  if (streak < 7) return false;
  const d = new Date();
  const records = loadRecords();
  const list = loadSupplements();
  if (list.length === 0) return false;

  const todayK = todayKey();
  const todayRec = records[todayK] || [];
  const todayDone = list.every(s => todayRec.includes(s.id));
  if (!todayDone) d.setDate(d.getDate() - 1);

  let hasSat = false, hasSun = false;
  for (let i = 0; i < 7; i++) {
    const dow = d.getDay();
    if (dow === 0) hasSun = true;
    if (dow === 6) hasSat = true;
    d.setDate(d.getDate() - 1);
  }
  return hasSat && hasSun;
}

function hasNewYearFull() {
  const list = loadSupplements();
  if (list.length === 0) return false;
  const records = loadRecords();
  return Object.keys(records).some(dk => {
    if (dk.endsWith('-01-01')) {
      const dayRec = records[dk] || [];
      return list.every(s => dayRec.includes(s.id));
    }
    return false;
  });
}

function hasAllKill() {
  const list = loadSupplements();
  if (list.length < 3) return false;
  const records = loadRecords();
  return Object.keys(records).some(dk => {
    const dayRec = records[dk] || [];
    return list.every(s => dayRec.includes(s.id));
  });
}

function hasBirthdayFull() {
  const birthday = localStorage.getItem('supp_birthday');
  if (!birthday) return false;
  const list = loadSupplements();
  if (list.length === 0) return false;
  const records = loadRecords();
  const parts = birthday.split('-');
  const mm = parts[1];
  const dd = parts[2];
  return Object.keys(records).some(dk => {
    if (dk.endsWith('-' + mm + '-' + dd)) {
      const dayRec = records[dk] || [];
      return list.every(s => dayRec.includes(s.id));
    }
    return false;
  });
}

function hasCheckBefore7() {
  const ct = loadCheckTimes();
  return Object.values(ct).some(time => {
    const h = parseInt(time.split(':')[0]);
    return h < 7;
  });
}

function hasCheckAfter22() {
  const ct = loadCheckTimes();
  return Object.values(ct).some(time => {
    const h = parseInt(time.split(':')[0]);
    return h >= 22;
  });
}

function saveCheckTime(suppId) {
  const ct = loadCheckTimes();
  const now = new Date();
  const hm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  ct[`${todayKey()}_${suppId}`] = hm;
  saveCheckTimes(ct);
}

let badgePopupQueue = [];
let badgePopupShowing = false;

function checkBadges() {
  const earned = loadBadges();
  const rewarded = loadBadgeRewards();
  const newBadges = [];
  let changed = false;
  BADGES.forEach(b => {
    if (!earned[b.id]) {
      try {
        if (b.check()) {
          earned[b.id] = todayKey();
          changed = true;
          if (!rewarded.includes(b.id)) {
            rewarded.push(b.id);
            newBadges.push(b);
          }
        }
      } catch(e) {}
    }
  });
  if (changed) {
    saveBadges(earned);
    saveBadgeRewards(rewarded);
    renderHeaderProgress();
    renderSavingsTrack();
  }
  if (newBadges.length > 0) {
    newBadges.forEach(b => badgePopupQueue.push(b));
    if (!badgePopupShowing) showNextBadgePopup();
  }
}

function recheckBadges() {
  const earned = loadBadges();
  let changed = false;
  BADGES.forEach(b => {
    if (earned[b.id]) {
      try {
        if (!b.check()) {
          delete earned[b.id];
          changed = true;
        }
      } catch(e) {}
    }
  });
  if (changed) {
    saveBadges(earned);
    renderBadges();
  }
}

function showNextBadgePopup() {
  if (badgePopupQueue.length === 0) {
    badgePopupShowing = false;
    return;
  }
  badgePopupShowing = true;
  const badge = badgePopupQueue.shift();
  showBadgePopup(badge);
}

function showBadgePopup(badge) {
  document.getElementById('badgePopupIcon').textContent = badge.icon;
  document.getElementById('badgePopupName').textContent = badge.name;
  document.getElementById('badgePopupDesc').textContent = badge.desc;
  document.getElementById('badgePopup').classList.add('active');
  fireBigConfetti();
  vibrate([50, 50, 100]);
}

function closeBadgePopup() {
  document.getElementById('badgePopup').classList.remove('active');
  setTimeout(showNextBadgePopup, 300);
}

document.getElementById('badgePopup').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeBadgePopup();
});

function renderBadges() {
  const container = document.getElementById('badgeSection');
  const list = loadSupplements();
  if (list.length === 0) {
    container.innerHTML = '';
    return;
  }
  const earned = loadBadges();
  const categories = ['연속 복용', '누적 복용', '특수 업적', '시간대 업적'];
  const earnedCount = Object.keys(earned).length;

  let html = `<div class="badge-section">
    <h3>뱃지 (${earnedCount}/${BADGES.length})</h3>`;

  categories.forEach(cat => {
    const catBadges = BADGES.filter(b => b.category === cat);
    html += `<div class="badge-category-label">${cat}</div>`;
    html += '<div class="badge-grid">';
    catBadges.forEach(b => {
      const isUnlocked = !!earned[b.id];
      html += `
        <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}" onclick="openBadgeDetail('${b.id}')" style="cursor:pointer">
          <span class="badge-icon">${b.icon}</span>
          <div class="badge-name">${esc(b.name)}</div>
          <div class="badge-desc">${isUnlocked ? esc(b.desc) : '???'}</div>
          ${isUnlocked ? `<div class="badge-date">${earned[b.id]}</div>` : ''}
        </div>`;
    });
    html += '</div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

// --- Badge Detail Modal ---
function openBadgeDetail(badgeId) {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return;
  const earned = loadBadges();
  const isUnlocked = !!earned[badge.id];

  document.getElementById('badgeDetailIcon').textContent = badge.icon;
  document.getElementById('badgeDetailName').textContent = badge.name;
  document.getElementById('badgeDetailDesc').textContent = isUnlocked ? badge.desc : '???';

  const content = document.getElementById('badgeDetailContent');
  content.className = 'badge-detail-content' + (isUnlocked ? ' unlocked' : '');

  const status = document.getElementById('badgeDetailStatus');
  if (isUnlocked) {
    status.className = 'badge-detail-status earned';
    status.textContent = '달성 ' + earned[badge.id];
  } else {
    status.className = 'badge-detail-status locked';
    status.textContent = '미달성';
  }

  document.getElementById('badgeDetail').classList.add('active');
}

function closeBadgeDetail() {
  document.getElementById('badgeDetail').classList.remove('active');
}

document.getElementById('badgeDetail').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeBadgeDetail();
});
