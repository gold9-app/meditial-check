// --- Stats ---
let statDays = 7;
document.querySelectorAll('.period-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    statDays = parseInt(btn.dataset.days);
    renderStats();
  });
});

function renderStats() {
  recheckBadges();
  const list = loadSupplements();
  const records = loadRecords();
  const days = statDays;

  renderStreak();

  // Savings hero
  if (list.length > 0) {
    const savings = calcSavings();
    const goal = 5000;
    const savPct = Math.min(Math.round(savings / goal * 100), 100);
    document.getElementById('savingsHero').innerHTML = `
      <div class="savings-hero">
        <div class="savings-hero-icon">🪙</div>
        <div class="savings-hero-amount">${savings.toLocaleString()}원</div>
        <div class="savings-hero-label">총 적립금</div>
        <div class="savings-hero-bar-wrap">
          <div class="savings-hero-bar">
            <div class="savings-hero-bar-fill" style="width:${savPct}%"></div>
          </div>
          <div class="savings-hero-bar-labels">
            <span>0원</span>
            <span>목표 ${goal.toLocaleString()}원</span>
          </div>
        </div>
      </div>`;
  } else {
    document.getElementById('savingsHero').innerHTML = '';
  }

  if (list.length === 0) {
    document.getElementById('statSummary').innerHTML = '';
    document.getElementById('chartBars').innerHTML = `
      <div class="stats-empty">
        <span class="empty-icon">📊</span>
        <div class="empty-title">아직 통계가 없어요</div>
        <div class="empty-desc">영양제를 등록하고 복용을 체크하면<br>여기에 통계가 나타나요!</div>
      </div>`;
    document.getElementById('calendarHeatmap').innerHTML = '';
    renderBadges();
    return;
  }

  // Compute per-supplement adherence
  const dateKeys = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateKeys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  }

  let totalPossible = 0;
  let totalTaken = 0;
  const perSupp = {};

  list.forEach(s => {
    perSupp[s.id] = { name: s.name, taken: 0, possible: days, color: getSuppColor(s.name) };
    dateKeys.forEach(dk => {
      totalPossible++;
      if (records[dk] && records[dk].includes(s.id)) {
        totalTaken++;
        perSupp[s.id].taken++;
      }
    });
  });

  const overallRate = totalPossible > 0 ? Math.round(totalTaken / totalPossible * 100) : 0;

  let perfectDays = 0;
  dateKeys.forEach(dk => {
    const dayRec = records[dk] || [];
    if (list.every(s => dayRec.includes(s.id))) perfectDays++;
  });

  document.getElementById('statSummary').innerHTML = `
    <div class="stat-box"><div class="value">${overallRate}%</div><div class="label">전체 복용률</div></div>
    <div class="stat-box"><div class="value">${perfectDays}일</div><div class="label">완벽한 날</div></div>
    <div class="stat-box"><div class="value">${(perfectDays * 100).toLocaleString()}원</div><div class="label">적립금</div></div>
  `;

  let barsHtml = '';
  Object.values(perSupp).forEach(ps => {
    const rate = Math.round(ps.taken / ps.possible * 100);
    const clr = ps.color;
    barsHtml += `
      <div class="chart-bar-row">
        <div class="chart-bar-label" style="color:${clr.text}">${esc(ps.name)}</div>
        <div class="chart-bar-track" style="background:${clr.bg}"><div class="chart-bar-fill" style="width:${rate}%; background:linear-gradient(90deg, ${clr.border}, ${clr.bar})"></div></div>
        <div class="chart-bar-value" style="color:${clr.text}">${rate}%</div>
      </div>`;
  });
  document.getElementById('chartBars').innerHTML = barsHtml;

  renderCalendar();
  renderBadges();
}

// --- Calendar Heatmap ---
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function renderCalendar() {
  const list = loadSupplements();
  const records = loadRecords();
  const container = document.getElementById('calendarHeatmap');

  if (list.length === 0) {
    container.innerHTML = '';
    return;
  }

  const totalSupps = list.length;
  const year = calendarYear;
  const month = calendarMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  const todayStr = todayKey();

  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  let html = `<div class="calendar-month-label">
    <button class="calendar-nav" onclick="changeCalMonth(-1)">◀</button>
    <span>${year}년 ${monthNames[month]}</span>
    <button class="calendar-nav" onclick="changeCalMonth(1)">▶</button>
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
    const isToday = dateKey === todayStr;
    const isFuture = new Date(year, month, d) > today;

    if (isFuture) {
      html += `<div class="calendar-day future">${d}</div>`;
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

    const stamp = level === 4 ? '<span class="day-stamp">적립완료</span>' : '';
    html += `<div class="calendar-day level-${level} ${isToday ? 'today' : ''}" title="${dateKey}: ${takenCount}/${totalSupps} 복용" style="cursor:pointer" onclick="openDateCheck('${dateKey}')">${d}${stamp}</div>`;
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

  // Monthly savings summary
  let monthPerfect = 0;
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dk = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (new Date(year, month, d) > today) continue;
    const dr = records[dk] || [];
    if (list.every(s => dr.includes(s.id))) monthPerfect++;
  }
  const totalSavings = calcSavings();
  html += `<div class="calendar-savings-summary">💰 총 적립금: <span>${totalSavings.toLocaleString()}원</span></div>`;

  container.innerHTML = html;
}

function changeCalMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  renderCalendar();
}

function openDateCheck(dateKey) {
  const parts = dateKey.split('-');
  const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  target.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() - 2);
  if (target < limit || target > today) return;
  selectedDate = target;
  // Switch to today tab
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('.nav-item[data-tab="today"]').classList.add('active');
  document.getElementById('today').classList.add('active');
  renderToday();
}
