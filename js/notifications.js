// --- Notifications ---
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

function checkAlarms() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const hm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const list = loadSupplements();
  const records = loadRecords();
  const key = todayKey();
  const todayRec = records[key] || [];

  list.forEach(s => {
    if (s.time === hm && !todayRec.includes(s.id)) {
      const notifKey = `notif_${key}_${s.id}`;
      if (!sessionStorage.getItem(notifKey)) {
        new Notification('영양제 알림', {
          body: `${s.name} 복용할 시간이에요!`,
          icon: 'icon.png'
        });
        sessionStorage.setItem(notifKey, '1');
      }
    }
  });
}

function checkEveningReminder() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  if (now.getHours() !== 21) return;

  const list = loadSupplements();
  if (list.length === 0) return;

  const records = loadRecords();
  const key = todayKey();
  const todayRec = records[key] || [];
  const missed = list.filter(s => !todayRec.includes(s.id));

  if (missed.length === 0) return;

  const notifKey = `notif_evening_${key}`;
  if (sessionStorage.getItem(notifKey)) return;

  const names = missed.map(s => s.name).join(', ');
  new Notification('미복용 영양제 알림', {
    body: `아직 안 드신 영양제가 ${missed.length}개 있어요!\n${names}`,
    icon: 'icon.png'
  });
  sessionStorage.setItem(notifKey, '1');
}

setInterval(() => { checkAlarms(); checkEveningReminder(); }, 30000);
checkAlarms();
checkEveningReminder();
