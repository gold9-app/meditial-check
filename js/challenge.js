// --- Challenge System (작심삼월) ---
const CHALLENGE_KEY = 'supp_challenge';
const CHALLENGE_DURATION = 1;
const CHALLENGE_TARGET = 70;

function loadChallenge() {
  return JSON.parse(localStorage.getItem(CHALLENGE_KEY) || 'null');
}

function saveChallenge(data) {
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(data));
}

const CHALLENGE_CODE = '333';
// Google Apps Script 웹앱 URL을 여기에 붙여넣으세요
const SHEET_URL = 'https://script.google.com/a/macros/next-generation.co.kr/s/AKfycbxdwmhS1yYRupGJEYU3lZdI8AvQJfwdtltr1sQ-kSpCLRwLE8ewVy9R6mCwzv271_V9/exec';

function startChallenge() {
  const codeInput = document.getElementById('challengeCodeInput');
  const phoneInput = document.getElementById('challengePhoneInput');
  const error = document.getElementById('challengeCodeError');
  const code = codeInput ? codeInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  // 참여코드 검증
  if (code !== CHALLENGE_CODE) {
    if (error) {
      error.textContent = '참여코드가 올바르지 않습니다.';
      error.style.display = 'block';
    }
    if (codeInput) codeInput.classList.add('error');
    vibrate([50, 30, 50]);
    return;
  }

  // 전화번호 검증 (010 제외 8자리)
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  if (!phone || phoneDigits.length !== 8) {
    if (error) {
      error.textContent = '전화번호를 올바르게 입력해주세요.';
      error.style.display = 'block';
    }
    if (phoneInput) phoneInput.classList.add('error');
    vibrate([50, 30, 50]);
    return;
  }

  const fullPhone = '010-' + phone.trim();
  const name = localStorage.getItem('supp_nickname') || '';
  const birth = localStorage.getItem('supp_birthday') || '';
  const data = { startDate: todayKey(), completed: false };
  saveChallenge(data);

  // 스프레드시트로 전송
  if (SHEET_URL) {
    sendToSheet({ name: name, birth: birth, phone: fullPhone, date: todayKey() });
  }

  renderChallengeDetail();
}

function getChallengeProgress() {
  const ch = loadChallenge();
  if (!ch) return null;

  const list = loadSupplements();
  const records = loadRecords();
  const start = new Date(ch.startDate);
  const today = new Date(todayKey());

  const totalMs = today - start;
  const elapsedDays = Math.floor(totalMs / (1000 * 60 * 60 * 24)) + 1;
  const cappedElapsed = Math.min(elapsedDays, CHALLENGE_DURATION);
  const remainingDays = Math.max(0, CHALLENGE_DURATION - elapsedDays);
  const isFinished = elapsedDays > CHALLENGE_DURATION;

  let perfectDays = 0;
  const perfectDates = [];

  if (list.length > 0) {
    for (let i = 0; i < cappedElapsed; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dayRec = records[dk] || [];
      if (list.every(s => dayRec.includes(s.id))) {
        perfectDays++;
        perfectDates.push(dk);
      }
    }
  }

  const rate = Math.round(perfectDays / CHALLENGE_DURATION * 100);
  const achieved = rate >= CHALLENGE_TARGET;

  if (achieved && !ch.completed) {
    ch.completed = true;
    saveChallenge(ch);
    checkBadges();
  }

  return {
    startDate: ch.startDate,
    elapsedDays: cappedElapsed,
    remainingDays,
    perfectDays,
    perfectDates,
    rate,
    isFinished,
    achieved,
    completed: ch.completed,
  };
}

function renderChallengeDetail() {
  const body = document.getElementById('challengeBody');
  const ch = loadChallenge();

  if (!ch) {
    body.innerHTML = renderChallengeIntro();
    return;
  }

  const progress = getChallengeProgress();

  if (progress.completed) {
    body.innerHTML = renderChallengeComplete(progress);
    return;
  }

  body.innerHTML = renderChallengeProgress(progress);
  challengeCalMonth = new Date().getMonth();
  challengeCalYear = new Date().getFullYear();
  renderChallengeCalendar(progress);
}

function renderChallengeIntro() {
  return `
    <div class="challenge-intro">
      <div class="challenge-intro-icon">🔥</div>
      <h2 class="challenge-intro-title">작심삼월 챌린지</h2>
      <p class="challenge-intro-desc">
        3개월(90일) 동안 꾸준히 영양제를 복용하세요!<br>
        <strong>완벽한 날(모든 영양제 체크) 비율 70% 이상</strong> 달성하면<br>
        특별 뱃지와, 상품 응모권을 드려요!
      </p>
      <div class="challenge-rules">
        <div class="challenge-rule">
          <span class="challenge-rule-num">1</span>
          <span>참여하기 버튼을 누르면 오늘부터 시작!</span>
        </div>
        <div class="challenge-rule">
          <span class="challenge-rule-num">2</span>
          <span>매일 등록된 모든 영양제를 체크하면 "완벽한 날"</span>
        </div>
        <div class="challenge-rule">
          <span class="challenge-rule-num">3</span>
          <span>90일 중 완벽한 날이 70% 이상이면 달성!</span>
        </div>
      </div>
      <div class="challenge-code-group">
        <label class="challenge-code-label">전화번호</label>
        <div class="phone-input-wrap">
          <span class="phone-prefix">010-</span>
          <input type="tel" id="challengePhoneInput" class="challenge-code-input phone-suffix" placeholder="0000-0000" maxlength="9" inputmode="tel">
        </div>
      </div>
      <div class="challenge-code-group">
        <label class="challenge-code-label">참여코드 입력</label>
        <input type="text" id="challengeCodeInput" class="challenge-code-input" placeholder="참여코드를 입력하세요" maxlength="10" inputmode="numeric" onkeydown="if(event.key==='Enter')startChallenge()">
        <div class="challenge-code-error" id="challengeCodeError"></div>
      </div>
      <button class="challenge-join-btn" onclick="startChallenge()">챌린지 참여하기</button>
    </div>`;
}

function renderChallengeProgress(p) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (p.rate / 100) * circumference;
  const statusMsg = p.rate >= CHALLENGE_TARGET
    ? '목표 달성 중! 이대로 쭉!'
    : '조금 더 힘내세요!';
  const statusClass = p.rate >= CHALLENGE_TARGET ? 'on-track' : 'behind';

  const endDate = new Date(p.startDate);
  endDate.setDate(endDate.getDate() + CHALLENGE_DURATION - 1);
  const endStr = `${endDate.getFullYear()}.${String(endDate.getMonth()+1).padStart(2,'0')}.${String(endDate.getDate()).padStart(2,'0')}`;

  return `
    <div class="challenge-progress-view">
      <div class="challenge-ring-wrap">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle class="challenge-ring-bg" cx="65" cy="65" r="54"></circle>
          <circle class="challenge-ring-bar" cx="65" cy="65" r="54"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="challenge-ring-text">
          <span class="challenge-ring-pct">${p.rate}%</span>
          <span class="challenge-ring-label">달성률</span>
        </div>
      </div>

      <div class="challenge-status ${statusClass}">${statusMsg}</div>

      <div class="challenge-stats">
        <div class="challenge-stat-box">
          <div class="value">${p.elapsedDays}</div>
          <div class="label">경과일</div>
        </div>
        <div class="challenge-stat-box">
          <div class="value">${p.perfectDays}</div>
          <div class="label">완벽한 날</div>
        </div>
        <div class="challenge-stat-box">
          <div class="value">${p.remainingDays}</div>
          <div class="label">남은 일수</div>
        </div>
      </div>

      <div class="challenge-period">
        <span>기간: ${p.startDate.replace(/-/g,'.')} ~ ${endStr}</span>
        <span>목표: 완벽한 날 ${CHALLENGE_TARGET}% 이상</span>
      </div>

      <div class="challenge-calendar-section">
        <h3>복용 캘린더</h3>
        <div id="challengeCalendar"></div>
      </div>
    </div>`;
}

let challengeCalMonth = new Date().getMonth();
let challengeCalYear = new Date().getFullYear();

function renderChallengeCalendar(p) {
  const container = document.getElementById('challengeCalendar');
  if (!container) return;

  const list = loadSupplements();
  const records = loadRecords();
  const totalSupps = list.length;
  const year = challengeCalYear;
  const month = challengeCalMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  const todayStr = todayKey();
  const startD = new Date(p.startDate);
  startD.setHours(0,0,0,0);

  const endDate = new Date(p.startDate);
  endDate.setDate(endDate.getDate() + CHALLENGE_DURATION - 1);
  endDate.setHours(23,59,59,999);

  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  let html = `<div class="calendar-month-label">
    <button class="calendar-nav" onclick="changeChallengeCalMonth(-1)">◀</button>
    <span>${year}년 ${monthNames[month]}</span>
    <button class="calendar-nav" onclick="changeChallengeCalMonth(1)">▶</button>
  </div>`;

  html += '<div class="calendar-grid">';
  const weekdays = ['일','월','화','수','목','금','토'];
  weekdays.forEach(d => { html += `<div class="calendar-weekday">${d}</div>`; });

  const startDow = firstDay.getDay();
  for (let i = 0; i < startDow; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const thisDate = new Date(year, month, d);
    const isToday = dateKey === todayStr;
    const isFuture = thisDate > today;
    const isOutOfRange = thisDate < startD || thisDate > endDate;

    if (isFuture || isOutOfRange) {
      html += `<div class="calendar-day ${isFuture ? 'future' : 'empty'}">${isOutOfRange && !isFuture ? '' : d}</div>`;
      continue;
    }

    const dayRec = records[dateKey] || [];
    const takenCount = list.filter(s => dayRec.includes(s.id)).length;
    const rate = totalSupps > 0 ? takenCount / totalSupps : 0;

    let level = 0;
    if (rate > 0 && rate < 0.25) level = 1;
    else if (rate >= 0.25 && rate < 0.5) level = 2;
    else if (rate >= 0.5 && rate < 1) level = 3;
    else if (rate >= 1) level = 4;

    html += `<div class="calendar-day level-${level} ${isToday ? 'today' : ''}" title="${dateKey}: ${takenCount}/${totalSupps}">${d}</div>`;
  }

  html += '</div>';

  html += `<div class="calendar-legend">
    <span>부족</span>
    <div class="calendar-legend-box" style="background:var(--bg-tertiary)"></div>
    <div class="calendar-legend-box" style="background:#dbeafe"></div>
    <div class="calendar-legend-box" style="background:#93c5fd"></div>
    <div class="calendar-legend-box" style="background:#3b82f6"></div>
    <div class="calendar-legend-box" style="background:#1d4ed8"></div>
    <span>완벽</span>
  </div>`;

  container.innerHTML = html;
}

function changeChallengeCalMonth(delta) {
  challengeCalMonth += delta;
  if (challengeCalMonth > 11) { challengeCalMonth = 0; challengeCalYear++; }
  if (challengeCalMonth < 0) { challengeCalMonth = 11; challengeCalYear--; }
  const p = getChallengeProgress();
  if (p) renderChallengeCalendar(p);
}

function renderChallengeComplete(p) {
  return `
    <div class="challenge-complete">
      <div class="challenge-complete-icon">🎉</div>
      <h2 class="challenge-complete-title">작심삼월 챌린지 달성!</h2>
      <p class="challenge-complete-desc">
        축하합니다! 90일 동안 <strong>${p.rate}%</strong>의 완벽한 날을 달성했어요!
      </p>
      <div class="challenge-complete-badge">
        <span class="challenge-complete-badge-icon">🏅</span>
        <div class="challenge-complete-badge-name">작심삼월 챌린지</div>
        <div class="challenge-complete-badge-desc">특별 뱃지 획득!</div>
      </div>
      <div class="challenge-complete-stats">
        <div class="challenge-stat-box">
          <div class="value">${p.elapsedDays}</div>
          <div class="label">총 일수</div>
        </div>
        <div class="challenge-stat-box">
          <div class="value">${p.perfectDays}</div>
          <div class="label">완벽한 날</div>
        </div>
        <div class="challenge-stat-box">
          <div class="value">${p.rate}%</div>
          <div class="label">달성률</div>
        </div>
      </div>
      <a class="challenge-coupon-btn" href="https://meditial.co.kr/" target="_blank">응모권 받기</a>
    </div>`;
}

function openChallengeDetail() {
  renderChallengeDetail();
  document.getElementById('challengeOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeChallengeDetail() {
  document.getElementById('challengeOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function sendToSheet(data) {
  var params = Object.keys(data).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
  }).join('&');
  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = SHEET_URL + '?' + params;
  document.body.appendChild(iframe);
  setTimeout(function() { iframe.remove(); }, 10000);
}
