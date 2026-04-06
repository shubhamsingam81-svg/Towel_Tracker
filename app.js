// =============================================
// TOWEL TRACKER - Advanced PWA App
// =============================================

const STORAGE_KEY = 'towel_tracker_v2';

// ===== DATA LAYER =====
function load() {
    try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : { parties: [] }; }
    catch { return { parties: [] }; }
}
function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// ===== FORMATTING =====
function fmtNum(n) { return n === 0 ? '0' : n.toLocaleString('en-IN'); }
function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function toGrams(val, unit) { return unit === 'kg' ? Math.round(val * 1000) : Math.round(val); }
function fmtWt(g) {
    if (g === 0) return '0 g';
    if (g >= 1000) { const k = g / 1000; return (k % 1 === 0 ? k : k.toFixed(2)) + ' kg'; }
    return fmtNum(g) + ' g';
}
function fmtWtKg(g) {
    const k = g / 1000;
    if (k === 0) return '0 kg';
    return (k % 1 === 0 ? k : k.toFixed(2)) + ' kg';
}
function bestUnit(g) {
    if (g >= 1000) { const k = g / 1000; return { val: (k % 1 === 0 ? k.toString() : k.toFixed(2)), unit: 'kg' }; }
    return { val: g.toString(), unit: 'g' };
}
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ===== STATE =====
let data = load();
let curPartyId = null;
let editPartyId = null;
let editEntryIdx = null;
let curUnit = 'kg';
let pendingImage = null; // base64 string or null

// ===== SPLASH =====
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splash').classList.add('hide');
        showScreen('screen-parties');
        renderParties();
    }, 900);
});

// ===== NAVIGATION =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
function goBack() {
    curPartyId = null;
    showScreen('screen-parties');
    renderParties();
}

// ===== MODAL HELPERS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeBg(e, id) { if (e.target === e.currentTarget) closeModal(id); }

// ===== TOAST =====
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

// ===== PARTY RENDERING =====
function renderParties() {
    const list = document.getElementById('party-list');
    const search = document.getElementById('search-inp');
    const q = search ? search.value.toLowerCase() : '';
    const filtered = data.parties.filter(p => p.name.toLowerCase().includes(q));

    // Global stats
    const gs = document.getElementById('global-stats');
    const sw = document.getElementById('search-wrap');
    if (data.parties.length > 0) {
        gs.classList.remove('hidden');
        const totPcs = data.parties.reduce((s, p) => s + p.entries.reduce((a, e) => a + e.pcs, 0), 0);
        const totWt = data.parties.reduce((s, p) => s + p.entries.reduce((a, e) => a + e.wg, 0), 0);
        document.getElementById('gs-parties').textContent = data.parties.length;
        document.getElementById('gs-pcs').textContent = fmtNum(totPcs);
        document.getElementById('gs-wt').textContent = fmtWtKg(totWt);
    } else { gs.classList.add('hidden'); }

    if (data.parties.length > 2) sw.classList.remove('hidden');
    else sw.classList.add('hidden');

    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-box">
            <span class="empty-icon">🧺</span>
            <div class="empty-title">${q ? 'No results' : 'No Parties Yet'}</div>
            <div class="empty-sub">${q ? 'Try a different search' : 'Tap + to create your first textile party'}</div>
        </div>`;
        return;
    }

    list.innerHTML = filtered.map(p => {
        const tPcs = p.entries.reduce((s, e) => s + e.pcs, 0);
        const tWt = p.entries.reduce((s, e) => s + e.wg, 0);
        return `<div class="pcard" onclick="openParty('${p.id}')">
            <button class="pcard-del" onclick="event.stopPropagation();confirmDelParty('${p.id}')" title="Delete">✕</button>
            <div class="pcard-top">
                <span class="pcard-name">${escHtml(p.name)}</span>
                <span class="pcard-badge">${escHtml(p.size)}</span>
            </div>
            <div class="pcard-date">${fmtDate(p.date)}</div>
            <div class="pcard-stats">
                <div class="pcard-stat"><div class="pcard-stat-val">${fmtNum(tPcs)}</div><div class="pcard-stat-lbl">Pieces</div></div>
                <div class="pcard-stat"><div class="pcard-stat-val">${fmtWtKg(tWt)}</div><div class="pcard-stat-lbl">Weight</div></div>
                <div class="pcard-stat"><div class="pcard-stat-val">${p.entries.length}</div><div class="pcard-stat-lbl">Entries</div></div>
            </div>
        </div>`;
    }).join('');
}

// Search
document.addEventListener('DOMContentLoaded', () => {
    const si = document.getElementById('search-inp');
    const sx = document.getElementById('search-x');
    if (si) si.addEventListener('input', () => {
        sx.classList.toggle('hidden', si.value.length === 0);
        renderParties();
    });
});
function clearSearch() {
    const si = document.getElementById('search-inp');
    si.value = '';
    document.getElementById('search-x').classList.add('hidden');
    renderParties();
    si.focus();
}

// ===== PARTY CRUD =====
function openPartyModal(isEdit) {
    if (isEdit && curPartyId) {
        const p = data.parties.find(x => x.id === curPartyId);
        if (!p) return;
        editPartyId = p.id;
        document.getElementById('m-party-title').textContent = 'Edit Party';
        document.getElementById('ip-name').value = p.name;
        document.getElementById('ip-size').value = p.size;
        document.getElementById('ip-date').value = p.date;
    } else {
        editPartyId = null;
        document.getElementById('m-party-title').textContent = 'New Party';
        document.getElementById('f-party').reset();
        document.getElementById('ip-date').value = new Date().toISOString().split('T')[0];
    }
    openModal('m-party');
    setTimeout(() => document.getElementById('ip-name').focus(), 300);
}

function saveParty(e) {
    e.preventDefault();
    const name = document.getElementById('ip-name').value.trim();
    const size = document.getElementById('ip-size').value.trim();
    const date = document.getElementById('ip-date').value;
    if (!name || !size || !date) return;

    if (editPartyId) {
        const p = data.parties.find(x => x.id === editPartyId);
        if (p) { p.name = name; p.size = size; p.date = date; }
        toast('Party updated ✓');
    } else {
        data.parties.unshift({ id: genId(), name, size, date, entries: [] });
        toast('Party created ✓');
    }
    save(data);
    closeModal('m-party');
    renderParties();
    if (curPartyId) updateEntryHeader();
}

function confirmDelParty(id) {
    const p = data.parties.find(x => x.id === id);
    if (!p) return;
    document.getElementById('del-msg').textContent = `Delete "${p.name}" and all ${p.entries.length} entries?`;
    document.getElementById('btn-del-ok').onclick = () => {
        data.parties = data.parties.filter(x => x.id !== id);
        save(data);
        closeModal('m-del');
        toast('Party deleted');
        if (curPartyId === id) goBack(); else renderParties();
    };
    openModal('m-del');
}

// ===== ENTRY SCREEN =====
function openParty(id) {
    curPartyId = id;
    showScreen('screen-entries');
    updateEntryHeader();
    renderEntries();
}

function updateEntryHeader() {
    const p = data.parties.find(x => x.id === curPartyId);
    if (!p) return;
    document.getElementById('e-title').textContent = p.name;
    document.getElementById('e-sub').textContent = `${p.size} • ${fmtDate(p.date)}`;
}

function renderEntries() {
    const p = data.parties.find(x => x.id === curPartyId);
    if (!p) return;

    const tPcs = p.entries.reduce((s, e) => s + e.pcs, 0);
    const tWt = p.entries.reduce((s, e) => s + e.wg, 0);
    const cnt = p.entries.length;

    document.getElementById('t-pcs').textContent = fmtNum(tPcs);
    document.getElementById('t-wt').textContent = fmtWtKg(tWt);
    document.getElementById('t-cnt').textContent = cnt;

    // Averages
    const ab = document.getElementById('avg-bar');
    if (cnt > 0) {
        ab.style.display = '';
        document.getElementById('a-pcs').textContent = Math.round(tPcs / cnt);
        document.getElementById('a-wt').textContent = fmtWtKg(Math.round(tWt / cnt));
        document.getElementById('a-wpc').textContent = tPcs > 0 ? Math.round(tWt / tPcs) + ' g' : '—';
    } else {
        ab.style.display = 'none';
    }

    const tbody = document.getElementById('etbody');
    if (cnt === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3);">
            <span style="font-size:36px;display:block;margin-bottom:8px;">📝</span>
            No entries yet. Tap <strong>+</strong> to add.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = p.entries.map((e, i) => `<tr>
        <td><span class="entry-idx">${i + 1}</span></td>
        <td class="td-img">${e.img
            ? `<img class="entry-thumb" src="${e.img}" onclick="viewImage(${i})" alt="#${i+1}">`
            : `<div class="no-img-icon">📷</div>`}
        </td>
        <td class="td-pcs">${fmtNum(e.pcs)} pcs</td>
        <td class="td-wt">${fmtWt(e.wg)}</td>
        <td class="td-act">
            <button class="act-btn" onclick="openEditEntry(${i})" title="Edit">✏️</button>
            <button class="act-btn" onclick="confirmDelEntry(${i})" title="Delete">🗑️</button>
        </td>
    </tr>`).join('');
}

// ===== IMAGE HANDLING =====
function compressImage(file, maxW, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function triggerImagePick() {
    document.getElementById('ie-img').click();
}

async function onImagePicked(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    // Compress to max 600px wide, 0.6 quality to save localStorage space
    const base64 = await compressImage(file, 600, 0.6);
    pendingImage = base64;
    showImagePreview(base64);
}

function showImagePreview(src) {
    const wrap = document.getElementById('img-preview-wrap');
    const img = document.getElementById('img-preview');
    if (src) {
        img.src = src;
        wrap.classList.remove('empty');
    } else {
        img.src = '';
        wrap.classList.add('empty');
    }
}

function removeImage(ev) {
    ev.stopPropagation();
    pendingImage = null;
    document.getElementById('ie-img').value = '';
    showImagePreview(null);
}

function viewImage(idx) {
    const p = data.parties.find(x => x.id === curPartyId);
    if (!p || !p.entries[idx] || !p.entries[idx].img) return;
    document.getElementById('imgview-img').src = p.entries[idx].img;
    openModal('m-imgview');
}

// ===== ENTRY CRUD =====
function openEntryModal() {
    editEntryIdx = null;
    document.getElementById('m-entry-title').textContent = 'Add Entry';
    document.getElementById('f-entry').reset();
    curUnit = 'kg';
    pendingImage = null;
    showImagePreview(null);
    syncUnitUI();
    openModal('m-entry');
    setTimeout(() => document.getElementById('ie-pcs').focus(), 300);
}

function openEditEntry(idx) {
    const p = data.parties.find(x => x.id === curPartyId);
    if (!p || !p.entries[idx]) return;
    editEntryIdx = idx;
    const e = p.entries[idx];
    document.getElementById('m-entry-title').textContent = `Edit Entry #${idx + 1}`;
    document.getElementById('ie-pcs').value = e.pcs;
    const bu = bestUnit(e.wg);
    document.getElementById('ie-wt').value = bu.val;
    curUnit = bu.unit;
    pendingImage = e.img || null;
    showImagePreview(pendingImage);
    syncUnitUI();
    openModal('m-entry');
}

function setUnit(u) {
    const wtInp = document.getElementById('ie-wt');
    const val = parseFloat(wtInp.value);
    if (!isNaN(val) && val > 0) {
        if (curUnit === 'kg' && u === 'g') wtInp.value = Math.round(val * 1000);
        if (curUnit === 'g' && u === 'kg') wtInp.value = (val / 1000);
    }
    curUnit = u;
    syncUnitUI();
}

function syncUnitUI() {
    document.querySelectorAll('.ubtn').forEach(b => b.classList.toggle('active', b.dataset.u === curUnit));
    const inp = document.getElementById('ie-wt');
    inp.placeholder = curUnit === 'kg' ? 'e.g. 19.5' : 'e.g. 11500';
}

function qw(v) {
    curUnit = 'kg';
    syncUnitUI();
    document.getElementById('ie-wt').value = v;
}

function saveEntry(e) {
    e.preventDefault();
    const pcs = parseInt(document.getElementById('ie-pcs').value, 10);
    const wtVal = parseFloat(document.getElementById('ie-wt').value);
    if (!pcs || pcs <= 0) return toast('Enter valid pieces');
    if (!wtVal || wtVal <= 0) return toast('Enter valid weight');

    const wg = toGrams(wtVal, curUnit);
    const p = data.parties.find(x => x.id === curPartyId);
    if (!p) return;

    if (editEntryIdx !== null) {
        p.entries[editEntryIdx] = { pcs, wg, img: pendingImage || p.entries[editEntryIdx].img || null };
        toast('Entry updated ✓');
    } else {
        p.entries.push({ pcs, wg, img: pendingImage || null });
        toast('Entry added ✓');
    }
    pendingImage = null;
    save(data);
    closeModal('m-entry');
    renderEntries();
    editEntryIdx = null;
}

function confirmDelEntry(idx) {
    const p = data.parties.find(x => x.id === curPartyId);
    if (!p) return;
    const e = p.entries[idx];
    document.getElementById('del-msg').textContent = `Delete entry #${idx + 1} (${e.pcs} pcs, ${fmtWt(e.wg)})?`;
    document.getElementById('btn-del-ok').onclick = () => {
        p.entries.splice(idx, 1);
        save(data);
        closeModal('m-del');
        renderEntries();
        toast('Entry deleted');
    };
    openModal('m-del');
}

// ===== SHARE REPORT =====
function shareReport() {
    const p = data.parties.find(x => x.id === curPartyId);
    if (!p) return;
    const tPcs = p.entries.reduce((s, e) => s + e.pcs, 0);
    const tWt = p.entries.reduce((s, e) => s + e.wg, 0);

    let txt = `📋 ${p.name}\n`;
    txt += `Size: ${p.size} | Date: ${fmtDate(p.date)}\n`;
    txt += '━'.repeat(30) + '\n';
    p.entries.forEach((e, i) => {
        txt += `${(i + 1).toString().padStart(2)}) ${fmtNum(e.pcs).padStart(6)} pcs   ${fmtWt(e.wg).padStart(10)}\n`;
    });
    txt += '━'.repeat(30) + '\n';
    txt += `Total: ${fmtNum(tPcs)} pcs  |  ${fmtWtKg(tWt)}\n`;
    txt += `Entries: ${p.entries.length}`;

    if (navigator.share) {
        navigator.share({ title: p.name, text: txt }).catch(() => {});
    } else {
        navigator.clipboard.writeText(txt).then(() => toast('Report copied to clipboard!'));
    }
}

// ===== EXPORT ALL =====
function exportAllData() {
    if (data.parties.length === 0) return toast('No data to export');
    let txt = '🧺 TOWEL TRACKER - FULL REPORT\n';
    txt += '═'.repeat(35) + '\n\n';

    data.parties.forEach(p => {
        const tPcs = p.entries.reduce((s, e) => s + e.pcs, 0);
        const tWt = p.entries.reduce((s, e) => s + e.wg, 0);
        txt += `📋 ${p.name} (${p.size})\n`;
        txt += `   Date: ${fmtDate(p.date)}\n`;
        txt += '─'.repeat(30) + '\n';
        p.entries.forEach((e, i) => {
            txt += `   ${(i + 1).toString().padStart(2)}) ${fmtNum(e.pcs).padStart(6)} pcs   ${fmtWt(e.wg).padStart(10)}\n`;
        });
        txt += `   Total: ${fmtNum(tPcs)} pcs | ${fmtWtKg(tWt)}\n\n`;
    });

    if (navigator.share) {
        navigator.share({ title: 'Towel Tracker Report', text: txt }).catch(() => {});
    } else {
        navigator.clipboard.writeText(txt).then(() => toast('Full report copied!'));
    }
}
