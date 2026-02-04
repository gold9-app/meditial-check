// --- Manage ---
function renderManage() {
  const list = loadSupplements();
  const container = document.getElementById('manageList');
  if (list.length === 0) {
    container.innerHTML = `
      <div class="manage-empty">
        <span class="empty-icon">⚙️</span>
        <div class="empty-title">영양제를 추가해보세요</div>
        <div class="empty-desc">위의 버튼을 눌러 복용 중인<br>영양제를 등록할 수 있어요.</div>
      </div>`;
    return;
  }
  let html = '';
  list.forEach(s => {
    const lowStock = s.stock <= 3;
    const clr = getSuppColor(s.name);
    html += `
      <div class="manage-card" style="border-left: 4px solid ${clr.bar}; background: ${clr.bg}">
        <div class="manage-card-header">
          <span class="name" style="color:${clr.text}">${esc(s.name)}</span>
          <div class="manage-card-actions">
            <button onclick="openModal('${s.id}')" title="수정" aria-label="${esc(s.name)} 수정">✏️</button>
            <button class="delete-btn" onclick="deleteSupplement('${s.id}')" title="삭제" aria-label="${esc(s.name)} 삭제">🗑️</button>
          </div>
        </div>
        <div class="detail-row">${esc(s.time)} · ${esc(s.dose)}</div>
        <div class="stock-row">
          <span style="font-size:0.82rem;color:var(--text-muted)">재고:</span>
          <span style="font-size:0.88rem;font-weight:700;color:${lowStock ? 'var(--red)' : clr.text}">${s.stock}일분</span>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

function deleteSupplement(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const list = loadSupplements().filter(s => s.id !== id);
  saveSupplements(list);
  // Remove deleted supplement from all records
  const records = loadRecords();
  Object.keys(records).forEach(key => {
    records[key] = records[key].filter(rid => rid !== id);
  });
  saveRecords(records);
  renderManage();
  renderToday();
  recheckBadges();
}

// --- Modal ---
function openModal(editId) {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('active');
  if (editId) {
    const s = loadSupplements().find(x => x.id === editId);
    if (!s) return;
    document.getElementById('modalTitle').textContent = '영양제 수정';
    document.getElementById('editId').value = editId;
    const nameSelect = document.getElementById('inputName');
    const customInput = document.getElementById('inputCustomName');
    const isPreset = [...nameSelect.options].some(o => o.value === s.name && o.value !== '__custom__');
    if (isPreset) {
      nameSelect.value = s.name;
      customInput.style.display = 'none';
      customInput.value = '';
    } else {
      nameSelect.value = '__custom__';
      customInput.style.display = 'block';
      customInput.value = s.name;
    }
    document.getElementById('inputTime').value = s.time;
    document.getElementById('inputDose').value = s.dose;
    document.getElementById('inputStock').value = s.stock;
  } else {
    document.getElementById('modalTitle').textContent = '영양제 추가';
    document.getElementById('editId').value = '';
    document.getElementById('inputName').value = '';
    document.getElementById('inputCustomName').style.display = 'none';
    document.getElementById('inputCustomName').value = '';
    document.getElementById('inputTime').value = '09:00';
    document.getElementById('inputDose').value = '';
    document.getElementById('inputStock').value = 30;
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

function toggleCustomName() {
  const sel = document.getElementById('inputName');
  const custom = document.getElementById('inputCustomName');
  if (sel.value === '__custom__') {
    custom.style.display = 'block';
    custom.focus();
  } else {
    custom.style.display = 'none';
    custom.value = '';
  }
}

function saveSupplement() {
  const sel = document.getElementById('inputName').value;
  const name = (sel === '__custom__' ? document.getElementById('inputCustomName').value.trim() : sel.trim());
  const time = document.getElementById('inputTime').value;
  const dose = document.getElementById('inputDose').value.trim();
  let stock = parseInt(document.getElementById('inputStock').value) || 0;
  const editId = document.getElementById('editId').value;

  if (!name) { alert('영양제를 선택하세요'); return; }
  if (name.length > 20) { alert('이름은 20자 이내로 입력해주세요'); return; }
  if (!time) { alert('복용 시간을 선택해주세요'); return; }
  if (!dose) { alert('복용량을 입력하세요'); return; }
  if (stock < 0) stock = 0;
  if (stock > 9999) { alert('재고는 9999 이하로 입력해주세요'); return; }

  const list = loadSupplements();

  if (editId) {
    const s = list.find(x => x.id === editId);
    if (s) {
      s.name = name;
      s.time = time;
      s.dose = dose;
      s.stock = stock;
    }
  } else {
    list.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, time, dose, stock
    });
  }

  saveSupplements(list);
  closeModal();
  renderManage();
  renderToday();
  checkBadges();
}
