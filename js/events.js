// =============================================
// 이벤트 & 공지 데이터
// 여기만 수정하면 이벤트탭 + 띠배너 자동 반영
// =============================================

const EVENT_DATA = [
  // ── 이벤트 ──
  {
    type: 'event',           // 'event' 또는 'notice'
    status: '진행중',         // '진행중' 또는 '종료'
    title: '메디셜 신규 회원 이벤트',
    desc: '150,000원 혜택 즉시제공!',
    ticker: '🎁 신규회원 150,000원 혜택 즉시제공!',  // 띠배너 텍스트 (없으면 배너에 안 뜸)
    url: '',                 // 빈 문자열이면 앱 내 상세(openEventDetail)
    detail: true,            // true면 앱 내 상세 페이지 사용
  },
  {
    type: 'event',
    status: '진행중',
    title: '작심삼월 챌린지',
    desc: '3월 연속 복용시 이벤트응모!',
    ticker: '🔥 작심삼월 챌린지 진행중!',
    url: '',
    detail: 'challenge',
  },
  {
    type: 'event',
    status: '종료',
    title: '앱 출시 기념 이벤트',
    desc: '참여해주신 모든 분들 감사합니다.',
    ticker: '',              // 빈 문자열 = 띠배너에 표시 안 함
    url: 'https://meditial.co.kr/event/list.html?cate_no=103',
  },

  // ── 공지 ──
  {
    type: 'notice',
    status: '공지',
    title: '쿠폰 입력 안내',
    desc: '보유한 쿠폰을 입력하고 할인 혜택을 받으세요!',
    ticker: '',
    url: 'https://meditial.co.kr/myshop/coupon/coupon.html',
  },
  {
    type: 'notice',
    status: '공지',
    title: '메디셜 앱 이용 안내',
    desc: '영양제 체크 앱 사용법을 확인하세요.',
    ticker: '',
    url: 'https://meditial.co.kr',
  },
];

// =============================================
// 렌더링 (수정 불필요)
// =============================================

function renderEvents() {
  // 이벤트 탭
  const eventContainer = document.getElementById('eventListInner');
  const noticeContainer = document.getElementById('noticeListInner');
  let eventHTML = '';
  let noticeHTML = '';

  EVENT_DATA.forEach(ev => {
    const badgeClass = ev.status === '종료' ? 'ended' : ev.type === 'notice' ? 'notice' : '';
    const isChallenge = ev.detail === 'challenge';
    const isDetail = ev.detail && ev.detail !== 'challenge' && !ev.url;

    let card;
    if (isChallenge) {
      card = `<div class="event-card" onclick="openChallengeDetail()">
        <span class="event-badge ${badgeClass}">${ev.status}</span>
        <div class="event-card-title">${ev.title}</div>
        <div class="event-card-desc">${ev.desc}</div>
        <span class="event-arrow">→</span>
      </div>`;
    } else if (isDetail) {
      card = `<div class="event-card" onclick="openEventDetail()">
        <span class="event-badge ${badgeClass}">${ev.status}</span>
        <div class="event-card-title">${ev.title}</div>
        <div class="event-card-desc">${ev.desc}</div>
        <span class="event-arrow">→</span>
      </div>`;
    } else {
      card = `<a class="event-card" href="${ev.url}" target="_blank">
        <span class="event-badge ${badgeClass}">${ev.status}</span>
        <div class="event-card-title">${ev.title}</div>
        <div class="event-card-desc">${ev.desc}</div>
        <span class="event-arrow">→</span>
      </a>`;
    }

    if (ev.type === 'notice') noticeHTML += card;
    else eventHTML += card;
  });

  if (eventContainer) eventContainer.innerHTML = eventHTML;
  if (noticeContainer) noticeContainer.innerHTML = noticeHTML;

  // 띠배너
  renderTicker();
}

function renderTicker() {
  const ticker = document.getElementById('eventTicker');
  const items = EVENT_DATA.filter(ev => ev.ticker && ev.status !== '종료');
  if (items.length === 0) {
    ticker.style.display = 'none';
    return;
  }

  let tickerHTML = '<span class="event-ticker-badge">EVENT</span><div class="event-ticker-wrap">';
  items.forEach((ev, i) => {
    const isChallenge = ev.detail === 'challenge';
    const isDetail = ev.detail && ev.detail !== 'challenge' && !ev.url;
    if (isChallenge) {
      tickerHTML += `<span class="event-ticker-item${i === 0 ? ' active' : ''}" onclick="openChallengeDetail()" style="cursor:pointer">${ev.ticker}</span>`;
    } else if (isDetail) {
      tickerHTML += `<span class="event-ticker-item${i === 0 ? ' active' : ''}" onclick="openEventDetail()" style="cursor:pointer">${ev.ticker}</span>`;
    } else {
      tickerHTML += `<a class="event-ticker-item${i === 0 ? ' active' : ''}" href="${ev.url}" target="_blank">${ev.ticker}</a>`;
    }
  });
  tickerHTML += '</div>';
  ticker.innerHTML = tickerHTML;
  ticker.style.display = 'flex';

  // 전광판 전환
  if (items.length > 1) {
    const tickerItems = ticker.querySelectorAll('.event-ticker-item');
    let current = 0;
    setInterval(() => {
      tickerItems[current].classList.remove('active');
      tickerItems[current].classList.add('out');
      const prev = current;
      setTimeout(() => tickerItems[prev].classList.remove('out'), 400);
      current = (current + 1) % tickerItems.length;
      tickerItems[current].classList.add('active');
    }, 3000);
  }
}

renderEvents();
