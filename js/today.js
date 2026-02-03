// --- Date Navigation ---
function changeSelectedDate(delta) {
  const next = new Date(selectedDate);
  next.setDate(next.getDate() + delta);
  const today = new Date();
  today.setHours(0,0,0,0);
  next.setHours(0,0,0,0);
  if (next > today) return;
  const limit = new Date(today);
  limit.setDate(limit.getDate() - 2);
  if (next < limit) return;
  selectedDate = next;
  renderDateNav();
  renderToday();
}

function goToToday() {
  selectedDate = new Date();
  renderDateNav();
  renderToday();
}

function showPastCompletePrompt() {
  document.getElementById('pastPrompt').classList.add('active');
}

function closePastPromptAndGoToday() {
  document.getElementById('pastPrompt').classList.remove('active');
  goToToday();
}

function renderDateNav() {
  const container = document.getElementById('dateNav');
  const isTodaySelected = isSelectedToday();
  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const today = new Date();
  today.setHours(0,0,0,0);
  tomorrow.setHours(0,0,0,0);
  const isFutureDisabled = tomorrow > today;
  const prevDay = new Date(selectedDate);
  prevDay.setDate(prevDay.getDate() - 1);
  prevDay.setHours(0,0,0,0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() - 2);
  const isPastDisabled = prevDay < limit;

  container.innerHTML = `
    <div class="date-nav">
      <button class="date-nav-btn" onclick="changeSelectedDate(-1)" ${isPastDisabled ? 'disabled' : ''}>◀</button>
      <span class="date-nav-label">${formatDate(selectedDate)}</span>
      <button class="date-nav-btn" onclick="changeSelectedDate(1)" ${isFutureDisabled ? 'disabled' : ''}>▶</button>
      ${!isTodaySelected ? '<button class="go-today-btn" onclick="goToToday()">오늘로</button>' : ''}
    </div>
    ${!isTodaySelected ? '<div class="past-date-notice">과거 날짜의 복용 기록을 확인/수정합니다</div>' : ''}
  `;
}

// --- Header ---
document.getElementById('headerDate').textContent = formatDate(new Date());

// --- Streak Badge ---
function renderStreak() {
  const streak = calculateStreak();
  document.getElementById('streakBadge').innerHTML = streak > 0
    ? `<div class="streak-badge"><span class="streak-fire">🔥</span> ${streak}일 연속 복용 중!</div>`
    : '';
}

// --- Header Progress Ring ---
function renderHeaderProgress() {
  const list = loadSupplements();
  const container = document.getElementById('headerProgress');
  if (list.length === 0) {
    container.innerHTML = '';
    return;
  }

  const records = loadRecords();
  const key = todayKey();
  const todayRec = records[key] || [];
  const taken = list.filter(s => todayRec.includes(s.id)).length;
  const total = list.length;
  const pct = Math.round(taken / total * 100);

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (pct / 100) * circumference;

  container.innerHTML = `
    <div class="progress-ring-wrap">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle class="progress-ring-bg" cx="28" cy="28" r="22"/>
        <circle class="progress-ring-bar" cx="28" cy="28" r="22"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"/>
      </svg>
      <div class="progress-ring-text">${pct}%</div>
    </div>
    <div class="progress-detail">
      <strong>${taken}/${total}</strong> 복용 완료<br>
      ${taken === total ? '오늘 완벽해요!' : `${total - taken}개 남았어요`}
    </div>
  `;
}

// --- Savings Calc & Track (Piggy Bank Runner) ---
function calcSavings() {
  const list = loadSupplements();
  if (list.length === 0) return 0;
  const records = loadRecords();
  let perfectDays = 0;
  for (const key in records) {
    const dayRec = records[key];
    if (list.every(s => dayRec.includes(s.id))) perfectDays++;
  }
  const badgeRewards = loadBadgeRewards().length * 500;
  return perfectDays * 100 + badgeRewards;
}

function renderSavingsTrack() {
  const container = document.getElementById('savingsTrack');
  const list = loadSupplements();
  if (list.length === 0) {
    container.innerHTML = '';
    return;
  }
  const savings = calcSavings();
  const goal = 5000;
  const pct = Math.min(Math.round(savings / goal * 100), 100);
  container.innerHTML = `
    <div class="savings-track">
      <div class="savings-track-labels">
        <span class="savings-track-amount">🪙 ${savings.toLocaleString()}원</span>
        <span>${goal.toLocaleString()}원</span>
      </div>
      <div class="savings-track-bar">
        <div class="savings-track-fill" style="width:${pct}%"></div>
        <div class="savings-track-runner" style="left:${pct}%">🏃</div>
      </div>
    </div>
  `;
}

// --- Streak Calculation ---
function calculateStreak() {
  const list = loadSupplements();
  if (list.length === 0) return 0;
  const records = loadRecords();
  let streak = 0;
  const d = new Date();

  // Check today first
  const todayK = todayKey();
  const todayRec = records[todayK] || [];
  const todayDone = list.every(s => todayRec.includes(s.id));

  // If today is not done yet, start checking from yesterday
  if (!todayDone) {
    d.setDate(d.getDate() - 1);
  }

  for (let i = 0; i < 730; i++) {
    const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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

// --- Today ---
function renderToday() {
  const list = loadSupplements();
  const container = document.getElementById('todayList');
  renderHeaderProgress();
  renderSavingsTrack();
  renderStreak();
  renderDateNav();

  if (list.length === 0) {
    container.innerHTML = `
      <div class="today-empty">
        <span class="empty-icon">💊</span>
        <div class="empty-title">아직 등록된 영양제가 없어요</div>
        <div class="empty-desc">영양제를 추가하고<br>매일 복용을 체크해보세요!</div>
        <button class="add-btn" onclick="openModal()" style="max-width:220px;margin:0 auto">+ 영양제 추가하기</button>
      </div>`;
    return;
  }

  const records = loadRecords();
  const key = selectedDateKey();
  const todayRec = records[key] || [];

  // Check all done
  const allDone = list.every(s => todayRec.includes(s.id));

  // group by time
  const groups = {};
  list.forEach(s => {
    const t = s.time || '00:00';
    if (!groups[t]) groups[t] = [];
    groups[t].push(s);
  });

  const sortedTimes = Object.keys(groups).sort();
  let html = '';

  // Care message + Recovery (only on real today)
  if (isSelectedToday()) {
    if (allDone) {
      html += `
        <div class="completion-banner">
          <span class="celebrate-icon">🪙</span>
          <div class="celebrate-title">오늘의 건강 적립완료!!</div>
          <div class="celebrate-desc">${getDailyRandom(CARE_DONE, 1)}</div>
        </div>`;
    } else {
      html += `
        <div class="care-message">
          <span class="care-icon">💬</span>
          <div class="care-text">${getDailyRandom(CARE_NOT_DONE, 2)}</div>
        </div>`;
    }
  } else if (allDone) {
    html += `
      <div class="completion-banner">
        <span class="celebrate-icon">🎉</span>
        <div class="celebrate-title">이 날 영양제 완료!</div>
        <div class="celebrate-desc">모든 영양제를 복용했어요!</div>
      </div>`;
  }

  sortedTimes.forEach(time => {
    html += `<div class="time-group">`;
    html += `<div class="time-group-label">${time}</div>`;
    groups[time].forEach(s => {
      const checked = todayRec.includes(s.id);
      const lowStock = s.stock <= 3;
      const clr = getSuppColor(s.name);
      html += `
        <div class="supp-card ${checked ? 'checked' : ''}" data-id="${s.id}" style="border-left: 4px solid ${clr.bar}; ${!checked ? 'background:' + clr.bg : ''}">
          <button class="check-btn" onclick="toggleCheck('${s.id}', event)" style="${!checked ? 'border-color:' + clr.bar : ''}">${checked ? '✓' : ''}</button>
          <div class="info">
            <div class="name" style="${!checked ? 'color:' + clr.text : ''}">${esc(s.name)}</div>
            <div class="detail">${esc(s.dose)}</div>
          </div>
          <div class="stock-badge ${lowStock ? 'low' : ''}" style="${!lowStock ? 'background:' + clr.border + '40; color:' + clr.text : ''}">${s.stock}일분</div>
        </div>`;
    });
    html += `</div>`;
  });
  container.innerHTML = html;
}

function toggleCheck(id, event) {
  const records = loadRecords();
  const key = selectedDateKey();
  if (!records[key]) records[key] = [];

  const list = loadSupplements();
  const supp = list.find(s => s.id === id);
  if (!supp) return;

  const idx = records[key].indexOf(id);
  const isChecking = idx === -1;

  if (isChecking) {
    records[key].push(id);
    if (supp.stock > 0) {
      supp.stock--;
      const sl = JSON.parse(localStorage.getItem('supp_stock_log') || '{}');
      sl[`${key}_${id}`] = true;
      localStorage.setItem('supp_stock_log', JSON.stringify(sl));
    }
    saveCheckTime(id);

    // Haptic + confetti
    vibrate(30);
    if (event) {
      const rect = event.target.getBoundingClientRect();
      fireConfetti(rect.left + rect.width / 2, rect.top);
    }

    // Check if all done after this check
    const allDone = list.every(s => s.id === id || records[key].includes(s.id));
    if (allDone) {
      vibrate([50, 50, 100]);
      setTimeout(() => fireBigConfetti(), 300);
    }

    // Past date all done → prompt to go back to today
    if (allDone && !isSelectedToday()) {
      saveRecords(records);
      saveSupplements(list);
      renderToday();
      checkBadges();
      setTimeout(() => {
        showPastCompletePrompt();
      }, 600);
      return;
    }
  } else {
    records[key].splice(idx, 1);
    const sl = JSON.parse(localStorage.getItem('supp_stock_log') || '{}');
    const slKey = `${key}_${id}`;
    if (sl[slKey]) {
      supp.stock++;
      delete sl[slKey];
      localStorage.setItem('supp_stock_log', JSON.stringify(sl));
    }
    // Remove check time record
    const ct = loadCheckTimes();
    delete ct[`${key}_${id}`];
    saveCheckTimes(ct);
  }

  // 재고 0이면 사라지는 애니메이션 + 자동 삭제 + 재구매 팝업
  if (isChecking && supp.stock <= 0) {
    const suppName = supp.name;
    const cardEl = document.querySelector(`.supp-card[data-id="${id}"]`);
    const removeIdx = list.findIndex(s => s.id === id);
    if (removeIdx !== -1) list.splice(removeIdx, 1);
    saveRecords(records);
    saveSupplements(list);
    checkBadges();
    if (cardEl) {
      cardEl.classList.add('stock-out');
      cardEl.addEventListener('animationend', () => {
        renderToday();
        showRepurchasePopup(suppName);
      }, { once: true });
    } else {
      renderToday();
      showRepurchasePopup(suppName);
    }
    return;
  }

  saveRecords(records);
  saveSupplements(list);
  renderToday();
  if (isChecking) checkBadges();
  else recheckBadges();
}
