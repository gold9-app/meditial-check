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
    dateKeys.push(dateToKey(d));
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

  const totalSavings = calcSavings();
  document.getElementById('statSummary').innerHTML = `
    <div class="stat-box"><div class="value">${overallRate}%</div><div class="label">전체 복용률</div></div>
    <div class="stat-box"><div class="value">${perfectDays}일</div><div class="label">완벽한 날</div></div>
    <div class="stat-box"><div class="value">${totalSavings.toLocaleString()}원</div><div class="label">총 적립금</div></div>
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
  renderConditionSection();
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
    const dateKey = dateToKey(new Date(year, month, d));
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

// --- Condition Section ---
let conditionPeriod = 7; // 기본 1주

function setConditionPeriod(days, btn) {
  conditionPeriod = days;
  document.querySelectorAll('.condition-period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderConditionSection();
}

function renderConditionSection() {
  const container = document.getElementById('conditionSection');
  if (!container) return;

  const list = loadSupplements();
  const conditions = loadConditions();

  // 컨디션 데이터가 있는 영양제만 필터
  const suppWithData = list.filter(s => {
    if (!CONDITION_ITEMS || !CONDITION_ITEMS[s.name]) return false;
    // 데이터가 있는지 확인
    for (const dateKey in conditions) {
      if (conditions[dateKey][s.name]) return true;
    }
    return false;
  });

  if (suppWithData.length === 0) {
    container.innerHTML = `
      <div class="condition-section">
        <h3>컨디션 변화 추이</h3>
        <div class="condition-section-empty">
          <span class="condition-section-empty-icon">📈</span>
          <div class="condition-section-empty-text">아직 컨디션 기록이 없어요</div>
          <div class="condition-section-empty-desc">오늘 탭에서 컨디션을 체크하면<br>여기에 변화 추이가 나타나요!</div>
        </div>
      </div>
    `;
    return;
  }

  let html = `
    <div class="condition-section">
      <h3>컨디션 변화 추이</h3>
      <div class="condition-period-btns">
        <button class="condition-period-btn ${conditionPeriod === 7 ? 'active' : ''}" onclick="setConditionPeriod(7, this)">1주</button>
        <button class="condition-period-btn ${conditionPeriod === 14 ? 'active' : ''}" onclick="setConditionPeriod(14, this)">2주</button>
        <button class="condition-period-btn ${conditionPeriod === 21 ? 'active' : ''}" onclick="setConditionPeriod(21, this)">3주</button>
        <button class="condition-period-btn ${conditionPeriod === 28 ? 'active' : ''}" onclick="setConditionPeriod(28, this)">4주</button>
      </div>
      <div class="condition-graphs">
  `;

  suppWithData.forEach(supp => {
    const data = getConditionGraphData(supp.name, conditionPeriod);
    const clr = getSuppColor(supp.name);

    // 기간 내 변화율 계산 (첫 데이터 vs 마지막 데이터)
    let periodChange = null;
    if (data && data.length >= 2) {
      const firstScore = data[0].score;
      const lastScore = data[data.length - 1].score;
      if (firstScore > 0) {
        periodChange = Math.round(((lastScore - firstScore) / firstScore) * 100);
      }
    }

    html += `
      <div class="condition-graph-card" style="border-left: 4px solid ${clr.bar}">
        <div class="condition-graph-header">
          <span class="condition-graph-name" style="color: ${clr.text}">${esc(supp.name)}</span>
    `;

    if (periodChange !== null && periodChange > 0) {
      html += `
          <span class="condition-change positive">
            ↑ ${periodChange}%
          </span>
      `;
    }

    html += `
        </div>
    `;

    if (data && data.length >= 2) {
      html += renderLineGraph(data, clr);
    } else {
      html += `
        <div class="condition-graph-nodata">
          데이터가 더 쌓이면 그래프가 나타나요
        </div>
      `;
    }

    html += `</div>`;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function renderLineGraph(data, clr) {
  if (!data || data.length < 2) return '';

  const width = 280;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 25, left: 30 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // 점수 범위 (1-5)
  const minScore = 1;
  const maxScore = 5;

  // 데이터 포인트 좌표 계산
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((d.score - minScore) / (maxScore - minScore)) * graphHeight;
    return { x, y, ...d };
  });

  // 라인 path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // 영역 path (fill용)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  let svg = `
    <svg class="condition-line-graph" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
      <!-- Grid lines -->
      <g class="grid-lines">
  `;

  // 수평 그리드 라인 (점수 1-5)
  for (let i = 1; i <= 5; i++) {
    const y = padding.top + graphHeight - ((i - minScore) / (maxScore - minScore)) * graphHeight;
    svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border)" stroke-dasharray="2,2" />`;
    svg += `<text x="${padding.left - 5}" y="${y + 4}" class="grid-label" text-anchor="end">${i}</text>`;
  }

  svg += `
      </g>
      <!-- Area fill -->
      <path d="${areaPath}" fill="${clr.bg}" opacity="0.5" />
      <!-- Line -->
      <path d="${linePath}" fill="none" stroke="${clr.bar}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // X축 라벨 (첫번째와 마지막만)
  if (points.length > 0) {
    svg += `<text x="${points[0].x}" y="${height - 5}" class="x-label" text-anchor="middle">${points[0].label}</text>`;
    if (points.length > 1) {
      svg += `<text x="${points[points.length - 1].x}" y="${height - 5}" class="x-label" text-anchor="middle">${points[points.length - 1].label}</text>`;
    }
  }

  svg += `</svg>`;

  return svg;
}
