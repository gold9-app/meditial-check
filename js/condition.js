// --- Condition Check System ---

// 제품별 체크 항목 상수 (left: 나쁜상태, right: 좋은상태)
const CONDITION_ITEMS = {
  '글루코컷 혈당케어': [
    { key: 'vitality', label: '활력', icon: '⚡', left: '없어요', right: '넘쳐요' },
    { key: 'drowsy', label: '식후 나른함', icon: '😴', left: '심해요', right: '없어요' },
    { key: 'bloodSugar', label: '혈당', icon: '🩸', left: '불안정', right: '안정적' }
  ],
  '블러드싸이클': [
    { key: 'complexion', label: '혈색', icon: '🩸', left: '안좋아요', right: '좋아요' },
    { key: 'fatigue', label: '피로감', icon: '😩', left: '심해요', right: '없어요' },
    { key: 'bloodPressure', label: '혈압', icon: '💓', left: '불안정', right: '안정적' }
  ],
  '헬리컷': [
    { key: 'digestion', label: '소화 상태', icon: '🫃', left: '안좋아요', right: '좋아요' },
    { key: 'bloating', label: '더부룩함', icon: '🎈', left: '심해요', right: '없어요' },
    { key: 'bowel', label: '배변 활동', icon: '🚽', left: '불규칙', right: '규칙적' }
  ],
  '판토오틴': [
    { key: 'hair', label: '모발 상태', icon: '💇', left: '안좋아요', right: '좋아요' },
    { key: 'scalp', label: '두피 컨디션', icon: '🧴', left: '안좋아요', right: '좋아요' },
    { key: 'vitality', label: '활력', icon: '⚡', left: '없어요', right: '넘쳐요' }
  ],
  '퓨어톤부스트': [
    { key: 'skinTone', label: '피부 톤', icon: '✨', left: '칙칙해요', right: '밝아요' },
    { key: 'skinElasticity', label: '피부 탄력', icon: '🫧', left: '없어요', right: '탱탱해요' },
    { key: 'vitality', label: '활력', icon: '⚡', left: '없어요', right: '넘쳐요' }
  ],
  '멜라토닌': [
    { key: 'sleepQuality', label: '수면 질', icon: '🌙', left: '안좋아요', right: '좋아요' },
    { key: 'wakeRefresh', label: '기상 시 개운함', icon: '🌅', left: '피곤해요', right: '개운해요' },
    { key: 'sleepSpeed', label: '잠드는 속도', icon: '😴', left: '느려요', right: '빨라요' }
  ],
  '활성엽산': [
    { key: 'energy', label: '에너지', icon: '⚡', left: '없어요', right: '넘쳐요' },
    { key: 'focus', label: '집중력', icon: '🎯', left: '흐려요', right: '또렷해요' },
    { key: 'skinTone', label: '피부톤', icon: '✨', left: '칙칙해요', right: '밝아요' }
  ],
  '상어연골환': [
    { key: 'jointComfort', label: '관절 편안함', icon: '🦴', left: '불편해요', right: '편해요' },
    { key: 'stiffness', label: '뻣뻣함', icon: '🧊', left: '심해요', right: '없어요' },
    { key: 'vitality', label: '활력', icon: '⚡', left: '없어요', right: '넘쳐요' }
  ]
};

// 이모지 점수 옵션
const SCORE_EMOJIS = ['😔', '😐', '🙂', '😊', '😄'];
const SCORE_LABELS = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'];

// localStorage 키
const CONDITION_KEY = 'supp_condition';
const CONDITION_START_KEY = 'supp_condition_start';

// 컨디션 데이터 로드/저장
function loadConditions() {
  try { return JSON.parse(localStorage.getItem(CONDITION_KEY) || '{}'); }
  catch(e) { console.error('loadConditions parse error', e); return {}; }
}

function saveConditions(data) {
  localStorage.setItem(CONDITION_KEY, JSON.stringify(data));
}

function loadConditionStarts() {
  try { return JSON.parse(localStorage.getItem(CONDITION_START_KEY) || '{}'); }
  catch(e) { console.error('loadConditionStarts parse error', e); return {}; }
}

function saveConditionStarts(data) {
  localStorage.setItem(CONDITION_START_KEY, JSON.stringify(data));
}

// 오늘 컨디션 체크 여부
function isTodayConditionChecked() {
  const conditions = loadConditions();
  const today = todayKey();
  return conditions[today] && Object.keys(conditions[today]).length > 0;
}

// 팝업 열기
function openConditionCheck() {
  const popup = document.getElementById('conditionPopup');
  if (popup) {
    renderConditionPopup();
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// 팝업 닫기
function closeConditionCheck() {
  const popup = document.getElementById('conditionPopup');
  if (popup) {
    popup.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// 체크 UI 렌더링
function renderConditionPopup() {
  const container = document.getElementById('conditionPopupBody');
  if (!container) return;

  const list = loadSupplements();
  const conditions = loadConditions();
  const today = todayKey();
  const todayCondition = conditions[today] || {};

  // 등록된 영양제 중 체크 항목이 있는 것만 필터
  const suppWithItems = list.filter(s => CONDITION_ITEMS[s.name]);

  if (suppWithItems.length === 0) {
    container.innerHTML = `
      <div class="condition-empty">
        <span class="condition-empty-icon">📋</span>
        <div class="condition-empty-text">컨디션 체크할 영양제가 없어요</div>
        <div class="condition-empty-desc">등록된 영양제 중 컨디션 체크 항목이 있는 제품이 없습니다.</div>
      </div>
    `;
    return;
  }

  let html = '';
  suppWithItems.forEach(supp => {
    const items = CONDITION_ITEMS[supp.name];
    const clr = getSuppColor(supp.name);
    const suppCondition = todayCondition[supp.name] || {};

    html += `
      <div class="condition-card" style="border-left: 4px solid ${clr.bar}">
        <div class="condition-card-header" style="background: ${clr.bg}">
          <span class="condition-card-name" style="color: ${clr.text}">${esc(supp.name)}</span>
        </div>
        <div class="condition-items">
    `;

    items.forEach(item => {
      const currentScore = suppCondition[item.key];
      html += `
        <div class="condition-item">
          <div class="condition-item-info">
            <span class="condition-item-icon">${item.icon}</span>
            <span class="condition-item-label">${item.label}</span>
          </div>
          <div class="condition-score-wrap">
            <span class="condition-label-left">${item.left}</span>
            <div class="condition-scores" data-supp="${esc(supp.name)}" data-key="${item.key}">
      `;

      SCORE_EMOJIS.forEach((emoji, idx) => {
        const score = idx + 1;
        const selected = currentScore === score ? 'selected' : '';
        html += `
          <button class="condition-score-btn ${selected}"
                  data-score="${score}"
                  onclick="selectConditionScore('${esc(supp.name)}', '${item.key}', ${score}, this)"
                  title="${SCORE_LABELS[idx]}">
            ${emoji}
          </button>
        `;
      });

      html += `
            </div>
            <span class="condition-label-right">${item.right}</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 점수 선택 처리
function selectConditionScore(suppName, key, score, btn) {
  // UI 업데이트
  const parent = btn.closest('.condition-scores');
  parent.querySelectorAll('.condition-score-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // 데이터 저장
  const conditions = loadConditions();
  const today = todayKey();

  if (!conditions[today]) conditions[today] = {};
  if (!conditions[today][suppName]) conditions[today][suppName] = {};

  conditions[today][suppName][key] = score;
  saveConditions(conditions);

  // 시작일 기록 (최초 체크 시)
  const starts = loadConditionStarts();
  if (!starts[suppName]) {
    starts[suppName] = today;
    saveConditionStarts(starts);
  }

  // 햅틱 피드백
  vibrate(20);
}

// 저장 버튼 클릭
function saveConditionCheck() {
  const conditions = loadConditions();
  const today = todayKey();

  if (conditions[today] && Object.keys(conditions[today]).length > 0) {
    // 체크 완료 피드백
    vibrate([30, 50, 30]);
    fireBigConfetti();
    closeConditionCheck();
    renderToday(); // 버튼 상태 업데이트

    // 토스트 메시지
    showConditionToast('컨디션 체크 완료!');
  } else {
    showConditionToast('최소 한 개 이상 체크해주세요');
  }
}

// 토스트 메시지
function showConditionToast(msg) {
  let toast = document.getElementById('conditionToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'conditionToast';
    toast.className = 'condition-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// 그래프 데이터 계산 (기간별)
function getConditionGraphData(suppName, days) {
  const conditions = loadConditions();
  const items = CONDITION_ITEMS[suppName];
  if (!items) return null;

  const data = [];
  const d = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const checkDate = new Date(d);
    checkDate.setDate(d.getDate() - i);
    const dateKey = dateToKey(checkDate);

    const dayCondition = conditions[dateKey]?.[suppName];
    if (dayCondition) {
      let total = 0;
      let count = 0;

      items.forEach(item => {
        if (dayCondition[item.key] !== undefined) {
          total += dayCondition[item.key];
          count++;
        }
      });

      if (count > 0) {
        data.push({
          date: dateKey,
          score: total / count,
          label: formatShortDate(checkDate)
        });
      }
    }
  }

  return data;
}

// 짧은 날짜 포맷
function formatShortDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 컨디션 체크 버튼 렌더링 (오늘 탭용)
function renderConditionCheckButton() {
  const list = loadSupplements();
  const hasConditionItems = list.some(s => CONDITION_ITEMS[s.name]);

  if (!hasConditionItems) return '';

  const isChecked = isTodayConditionChecked();

  if (isChecked) {
    return `
      <button class="condition-check-btn checked" onclick="openConditionCheck()">
        <span class="condition-check-icon">✓</span>
        <span class="condition-check-text">오늘 컨디션 체크 완료</span>
      </button>
    `;
  }

  return `
    <button class="condition-check-btn" onclick="openConditionCheck()">
      <span class="condition-check-icon">💪</span>
      <span class="condition-check-text">오늘 컨디션은 어때요?</span>
      <span class="condition-check-arrow">→</span>
    </button>
  `;
}
