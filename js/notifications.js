// --- Advanced Notification System ---

// 격려 메시지 풀
const ENCOURAGE_MESSAGES = [
  "오늘도 건강 챙기셨네요!",
  "꾸준함이 최고의 보약이에요",
  "내일의 나에게 선물했어요",
  "작은 습관이 큰 변화를 만들어요",
  "오늘 하루도 수고했어요",
  "건강한 하루의 시작!",
  "몸이 고마워하고 있어요",
  "이 습관이 1년 뒤 나를 바꿔요",
  "오늘도 나를 위한 선택 완료!",
  "건강 적립 100원!",
];

// 주간 요약 메시지
function getWeeklyMessage(rate) {
  if (rate >= 90) return '완벽에 가까워요!';
  if (rate >= 70) return '잘하고 있어요!';
  if (rate >= 50) return '조금만 더 힘내봐요!';
  return '다음 주는 더 화이팅!';
}

// --- 알림 권한 ---
function checkNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    document.getElementById('notifBanner').style.display = 'block';
  }
}

function requestNotifPermission() {
  if (!('Notification' in window)) return;
  Notification.requestPermission().then(p => {
    document.getElementById('notifBanner').style.display = 'none';
  });
}

// --- 알림 전송 헬퍼 ---
function sendNotification(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  if (!getNotifSetting('enabled')) return false;

  try {
    new Notification(title, {
      body: body,
      icon: 'icon.png',
      tag: tag || undefined,
      renotify: !!tag
    });
    return true;
  } catch(e) {
    console.error('Notification error', e);
    return false;
  }
}

// 중복 방지 체크
function wasNotifSent(key) {
  return !!sessionStorage.getItem(key);
}

function markNotifSent(key) {
  sessionStorage.setItem(key, '1');
}

// --- A. 복용 시간 알림 ---
function checkTimeAlarms() {
  const settings = loadNotifSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const list = loadSupplements();
  const records = loadRecords();
  const key = todayKey();
  const todayRec = records[key] || [];

  // 같은 시간대 영양제 그룹화
  const toNotify = [];

  list.forEach(s => {
    // 영양제별 알림 설정 확인
    if (s.notifEnabled === false) return;

    // 이미 복용한 영양제는 스킵
    if (todayRec.includes(s.id)) return;

    // 시간 파싱
    const [h, m] = s.time.split(':').map(Number);
    const suppMinutes = h * 60 + m;

    // ±5분 범위 체크
    const diff = currentMinutes - suppMinutes;
    if (diff >= -5 && diff <= 5) {
      const notifKey = `notif_${key}_${s.id}`;
      if (!wasNotifSent(notifKey)) {
        toNotify.push(s);
        markNotifSent(notifKey);
      }
    }
  });

  // 알림 전송
  if (toNotify.length === 1) {
    sendNotification('영양제 알림', `${toNotify[0].name} 복용 시간이에요!`, 'time-alarm');
  } else if (toNotify.length > 1) {
    const names = toNotify.map(s => s.name).join(', ');
    sendNotification('영양제 알림', `${names} 복용 시간이에요!`, 'time-alarm');
  }
}

// --- A. 재알림 (5분 후) ---
function checkRepeatAlarms() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.repeatEnabled) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const list = loadSupplements();
  const records = loadRecords();
  const key = todayKey();
  const todayRec = records[key] || [];

  list.forEach(s => {
    if (s.notifEnabled === false) return;
    if (todayRec.includes(s.id)) return;

    const [h, m] = s.time.split(':').map(Number);
    const suppMinutes = h * 60 + m;

    // 5분 후 체크 (정확히 5분 후 ±1분)
    const diff = currentMinutes - suppMinutes;
    if (diff >= 4 && diff <= 6) {
      const repeatKey = `notif_repeat_${key}_${s.id}`;
      const firstKey = `notif_${key}_${s.id}`;
      if (wasNotifSent(firstKey) && !wasNotifSent(repeatKey)) {
        sendNotification('영양제 재알림', `아직 ${s.name} 안 드셨어요!`, 'repeat-alarm');
        markNotifSent(repeatKey);
      }
    }
  });
}

// --- B. 저녁 리마인더 ---
function checkEveningReminder() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.reminderEnabled) return;

  const now = new Date();
  const [rh, rm] = settings.reminderTime.split(':').map(Number);

  if (now.getHours() !== rh || now.getMinutes() !== rm) return;

  const list = loadSupplements();
  if (list.length === 0) return;

  const records = loadRecords();
  const key = todayKey();
  const todayRec = records[key] || [];
  const missed = list.filter(s => !todayRec.includes(s.id));

  if (missed.length === 0) return;

  const notifKey = `notif_evening_${key}`;
  if (wasNotifSent(notifKey)) return;

  const names = missed.map(s => s.name).join(', ');
  sendNotification('미복용 영양제 알림', `오늘 ${missed.length}개 영양제가 남았어요!\n${names}`, 'evening');
  markNotifSent(notifKey);
}

// --- B. 연속 미복용 경고 ---
function checkMissedAlarms() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.missedEnabled) return;

  const now = new Date();
  // 저녁 시간에만 체크 (21시)
  if (now.getHours() !== 21) return;

  const notifKey = `notif_missed_${todayKey()}`;
  if (wasNotifSent(notifKey)) return;

  const list = loadSupplements();
  const records = loadRecords();

  list.forEach(s => {
    let missedDays = 0;
    const d = new Date();

    // 오늘부터 역순으로 체크
    for (let i = 0; i < 7; i++) {
      const dk = dateToKey(d);
      const dayRec = records[dk] || [];
      if (!dayRec.includes(s.id)) {
        missedDays++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    if (missedDays >= 3) {
      sendNotification('미복용 경고', `${s.name} ${missedDays}일째 미복용! 건강 챙기세요`, 'missed-' + s.id);
    } else if (missedDays === 2) {
      sendNotification('미복용 알림', `${s.name} 2일째 못 드셨네요. 오늘은 꼭!`, 'missed-' + s.id);
    }
  });

  markNotifSent(notifKey);
}

// --- B. 주간 요약 (일요일 20시) ---
function checkWeeklySummary() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.weeklyEnabled) return;

  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() !== 20) return; // 일요일 20시

  const notifKey = `notif_weekly_${todayKey()}`;
  if (wasNotifSent(notifKey)) return;

  const list = loadSupplements();
  if (list.length === 0) return;

  const records = loadRecords();
  let totalPossible = 0;
  let totalTaken = 0;

  // 최근 7일 계산
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = dateToKey(d);
    const dayRec = records[dk] || [];

    list.forEach(s => {
      totalPossible++;
      if (dayRec.includes(s.id)) totalTaken++;
    });
  }

  const rate = totalPossible > 0 ? Math.round(totalTaken / totalPossible * 100) : 0;
  const message = getWeeklyMessage(rate);

  sendNotification('주간 복용 요약', `이번 주 복용률 ${rate}%! ${message}`, 'weekly');
  markNotifSent(notifKey);
}

// --- B. 재고 소진 예측 (매일 09시) ---
function checkStockAlarms() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.stockEnabled) return;

  const now = new Date();
  if (now.getHours() !== 9) return;

  const notifKey = `notif_stock_${todayKey()}`;
  if (wasNotifSent(notifKey)) return;

  const list = loadSupplements();
  const warnings = [];

  list.forEach(s => {
    if (s.stock === 0) {
      warnings.push({ name: s.name, days: 0, level: 'critical' });
    } else if (s.stock <= 3) {
      warnings.push({ name: s.name, days: s.stock, level: 'low' });
    } else if (s.stock <= 7) {
      warnings.push({ name: s.name, days: s.stock, level: 'warning' });
    }
  });

  if (warnings.length > 0) {
    const critical = warnings.filter(w => w.level === 'critical');
    const low = warnings.filter(w => w.level === 'low');

    if (critical.length > 0) {
      const names = critical.map(w => w.name).join(', ');
      sendNotification('재고 긴급', `${names} 오늘 마지막이에요! 재구매하세요`, 'stock-critical');
    } else if (low.length > 0) {
      const w = low[0];
      sendNotification('재고 알림', `${w.name} 재고 ${w.days}일분! 재구매 필요`, 'stock-low');
    }
  }

  markNotifSent(notifKey);
}

// --- C. 스트릭 위험 알림 ---
function checkStreakAlarm() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.streakEnabled) return;

  const now = new Date();
  const [rh, rm] = settings.reminderTime.split(':').map(Number);
  if (now.getHours() !== rh || now.getMinutes() !== rm) return;

  const notifKey = `notif_streak_${todayKey()}`;
  if (wasNotifSent(notifKey)) return;

  const list = loadSupplements();
  if (list.length === 0) return;

  const records = loadRecords();
  const key = todayKey();
  const todayRec = records[key] || [];
  const allDone = list.every(s => todayRec.includes(s.id));

  if (allDone) return; // 이미 완료

  // 어제까지의 스트릭 계산
  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const dk = dateToKey(d);
    const dayRec = records[dk] || [];
    if (list.every(s => dayRec.includes(s.id))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  if (streak >= 1) {
    const nextStreak = streak + 1;
    sendNotification('스트릭 알림', `오늘 체크하면 ${nextStreak}일 연속! 놓치지 마세요`, 'streak');
    markNotifSent(notifKey);
  }
}

// --- C. 뱃지 근접 알림 ---
function checkBadgeProximity() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.badgeEnabled) return;

  const now = new Date();
  if (now.getHours() !== 20) return; // 저녁 8시에 체크

  const notifKey = `notif_badge_${todayKey()}`;
  if (wasNotifSent(notifKey)) return;

  const earned = loadBadges();
  const streak = calculateStreak();

  // 연속 복용 뱃지 근접 체크
  const streakMilestones = [
    { days: 3, id: 'streak_3', name: '3일 연속' },
    { days: 7, id: 'streak_7', name: '일주일 연속' },
    { days: 14, id: 'streak_14', name: '2주 연속' },
    { days: 30, id: 'streak_30', name: '한 달 연속' },
    { days: 50, id: 'streak_50', name: '50일 연속' },
    { days: 100, id: 'streak_100', name: '100일 연속' },
  ];

  for (const milestone of streakMilestones) {
    if (!earned[milestone.id]) {
      const remaining = milestone.days - streak;
      if (remaining > 0 && remaining <= 3) {
        sendNotification('뱃지 획득 임박!', `${remaining}일만 더 하면 '${milestone.name}' 뱃지 획득!`, 'badge-proximity');
        markNotifSent(notifKey);
        return; // 하나만 알림
      }
    }
  }
}

// --- C. 챌린지 진행률 (월요일 09시) ---
function checkChallengeProgress() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.challengeEnabled) return;

  const now = new Date();
  if (now.getDay() !== 1 || now.getHours() !== 9) return; // 월요일 09시

  const notifKey = `notif_challenge_${todayKey()}`;
  if (wasNotifSent(notifKey)) return;

  if (typeof loadChallenge !== 'function') return;
  const ch = loadChallenge();
  if (!ch || ch.completed) return;

  if (typeof getChallengeProgress !== 'function') return;
  const progress = getChallengeProgress();
  if (!progress) return;

  let message;
  if (progress.rate >= 70) {
    message = `작심삼월 ${progress.rate}% 달성! 목표 도달! 이대로 쭉!`;
  } else {
    message = `작심삼월 ${progress.rate}% 달성 중! ${progress.remainingDays}일 남았어요`;
  }

  sendNotification('챌린지 진행률', message, 'challenge');
  markNotifSent(notifKey);
}

// --- C. 격려 메시지 (복용 완료 시 호출) ---
function showEncourageNotification() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.encourageEnabled) return;

  // 20% 확률로 격려 메시지
  if (Math.random() > 0.2) return;

  const notifKey = `notif_encourage_${todayKey()}`;
  if (wasNotifSent(notifKey)) return;

  const message = ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)];
  sendNotification('복용 완료!', message, 'encourage');
  markNotifSent(notifKey);
}

// --- C. 스트릭 달성 알림 (체크 후 호출) ---
function showStreakAchievement(streak) {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.streakEnabled) return;

  const milestones = [3, 7, 14, 30, 50, 100, 200, 365];
  if (milestones.includes(streak)) {
    sendNotification('스트릭 달성!', `${streak}일 연속 복용 달성! 대단해요!`, 'streak-achieve');
  }
}

// --- 알림 설정 UI 렌더링 ---
function renderNotifSettings() {
  const container = document.getElementById('notifSettingsBody');
  if (!container) return;

  const settings = loadNotifSettings();
  const list = loadSupplements();

  let html = `
    <div class="notif-setting-group">
      <div class="notif-setting-row main-toggle">
        <span class="notif-setting-label">전체 알림</span>
        <label class="notif-toggle">
          <input type="checkbox" ${settings.enabled ? 'checked' : ''} onchange="toggleNotifSetting('enabled', this.checked)">
          <span class="notif-toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="notif-setting-group ${!settings.enabled ? 'disabled' : ''}">
      <div class="notif-setting-header" onclick="toggleNotifGroup(this)">
        <span>복용 알림</span>
        <span class="notif-group-arrow">▼</span>
      </div>
      <div class="notif-setting-body">
  `;

  if (list.length === 0) {
    html += `<div class="notif-empty">등록된 영양제가 없습니다</div>`;
  } else {
    list.forEach(s => {
      const enabled = s.notifEnabled !== false;
      const clr = getSuppColor(s.name);
      html += `
        <div class="notif-supp-row" style="border-left: 3px solid ${clr.bar}">
          <div class="notif-supp-info">
            <span class="notif-supp-name" style="color:${clr.text}">${esc(s.name)}</span>
            <span class="notif-supp-time">${s.time}</span>
          </div>
          <label class="notif-toggle small">
            <input type="checkbox" ${enabled ? 'checked' : ''} onchange="toggleSuppNotif('${s.id}', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>

    <div class="notif-setting-group ${!settings.enabled ? 'disabled' : ''}">
      <div class="notif-setting-header" onclick="toggleNotifGroup(this)">
        <span>리마인더</span>
        <span class="notif-group-arrow">▼</span>
      </div>
      <div class="notif-setting-body">
        <div class="notif-setting-row">
          <span class="notif-setting-label">저녁 리마인더</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.reminderEnabled ? 'checked' : ''} onchange="toggleNotifSetting('reminderEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-row">
          <span class="notif-setting-label">리마인더 시간</span>
          <input type="time" class="notif-time-input" value="${settings.reminderTime}" onchange="setNotifTime(this.value)">
        </div>
        <div class="notif-setting-row">
          <span class="notif-setting-label">재알림 (5분 후)</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.repeatEnabled ? 'checked' : ''} onchange="toggleNotifSetting('repeatEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="notif-setting-group ${!settings.enabled ? 'disabled' : ''}">
      <div class="notif-setting-header" onclick="toggleNotifGroup(this)">
        <span>스마트 알림</span>
        <span class="notif-group-arrow">▼</span>
      </div>
      <div class="notif-setting-body">
        <div class="notif-setting-row">
          <span class="notif-setting-label">주간 요약 (일요일)</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.weeklyEnabled ? 'checked' : ''} onchange="toggleNotifSetting('weeklyEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-row">
          <span class="notif-setting-label">재고 소진 예측</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.stockEnabled ? 'checked' : ''} onchange="toggleNotifSetting('stockEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-row">
          <span class="notif-setting-label">연속 미복용 경고</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.missedEnabled ? 'checked' : ''} onchange="toggleNotifSetting('missedEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="notif-setting-group ${!settings.enabled ? 'disabled' : ''}">
      <div class="notif-setting-header" onclick="toggleNotifGroup(this)">
        <span>동기부여 알림</span>
        <span class="notif-group-arrow">▼</span>
      </div>
      <div class="notif-setting-body">
        <div class="notif-setting-row">
          <span class="notif-setting-label">스트릭 알림</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.streakEnabled ? 'checked' : ''} onchange="toggleNotifSetting('streakEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-row">
          <span class="notif-setting-label">뱃지 근접 알림</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.badgeEnabled ? 'checked' : ''} onchange="toggleNotifSetting('badgeEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-row">
          <span class="notif-setting-label">격려 메시지</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.encourageEnabled ? 'checked' : ''} onchange="toggleNotifSetting('encourageEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-row">
          <span class="notif-setting-label">챌린지 알림</span>
          <label class="notif-toggle">
            <input type="checkbox" ${settings.challengeEnabled ? 'checked' : ''} onchange="toggleNotifSetting('challengeEnabled', this.checked)">
            <span class="notif-toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// 설정 UI 헬퍼 함수
function toggleNotifSetting(key, value) {
  setNotifSetting(key, value);
  if (key === 'enabled') {
    renderNotifSettings(); // 전체 토글 시 UI 업데이트
  }
}

function toggleSuppNotif(suppId, enabled) {
  setSuppNotifEnabled(suppId, enabled);
}

function setNotifTime(value) {
  setNotifSetting('reminderTime', value);
}

function toggleNotifGroup(header) {
  const group = header.closest('.notif-setting-group');
  group.classList.toggle('collapsed');
}

function openNotifSettings() {
  renderNotifSettings();
  document.getElementById('notifSettingsPopup').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeNotifSettings() {
  document.getElementById('notifSettingsPopup').classList.remove('active');
  document.body.style.overflow = '';
}

// --- 메인 체크 루프 ---
function runNotificationChecks() {
  checkTimeAlarms();
  checkRepeatAlarms();
  checkEveningReminder();
  checkMissedAlarms();
  checkWeeklySummary();
  checkStockAlarms();
  checkStreakAlarm();
  checkBadgeProximity();
  checkChallengeProgress();
}

// 30초마다 체크
setInterval(runNotificationChecks, 30000);

// 초기 실행
runNotificationChecks();
