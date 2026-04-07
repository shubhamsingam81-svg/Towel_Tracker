// =============================================
// TOWEL TRACKER v3 — Party → Month → Size → Entries
// =============================================

const STORAGE_KEY = 'towel_tracker_v3';

// ===== DATA =====
function load() {
    try {
        // Try v3 first
        let d = localStorage.getItem(STORAGE_KEY);
        if (d) return JSON.parse(d);
        // Migrate from v2
        const v2 = localStorage.getItem('towel_tracker_v2');
        if (v2) return migrate(JSON.parse(v2));
        return { parties: [] };
    } catch { return { parties: [] }; }
}

function migrate(old) {
    const parties = (old.parties || []).map(op => {
        const monthName = op.date ? fmtMonthFromDate(op.date) : 'Default';
        const sizeName = op.size || 'Default';
        return {
            id: op.id || genId(),
            name: op.name || 'Unnamed',
            months: [{
                id: genId(),
                name: monthName,
                sizes: [{
                    id: genId(),
                    name: sizeName,
                    entries: (op.entries || []).map(e => ({
                        pcs: e.pcs,
                        wg: e.wg || e.weightGrams || 0,
                        img: e.img || null
                    }))
                }]
            }]
        };
    });
    const data = { parties };
    save(data);
    return data;
}

function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// ===== FORMAT =====
function fmtNum(n) { return n === 0 ? '0' : n.toLocaleString('en-IN'); }
function fmtMonthFromDate(s) {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}
function fmtMonthInput(s) {
    // input type=month gives "2026-04", display as "Apr 2026"
    if (!s) return '';
    const [y, m] = s.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
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

// ===== TOTALS HELPERS =====
function sizeTotal(sz) {
    const pcs = sz.entries.reduce((s, e) => s + e.pcs, 0);
    const wg = sz.entries.reduce((s, e) => s + e.wg, 0);
    return { pcs, wg, cnt: sz.entries.length };
}
function monthTotal(mo) {
    let pcs = 0, wg = 0, cnt = 0;
    mo.sizes.forEach(sz => { const t = sizeTotal(sz); pcs += t.pcs; wg += t.wg; cnt += t.cnt; });
    return { pcs, wg, cnt, sizes: mo.sizes.length };
}
function partyTotal(p) {
    let pcs = 0, wg = 0, cnt = 0, months = p.months.length;
    p.months.forEach(mo => { const t = monthTotal(mo); pcs += t.pcs; wg += t.wg; cnt += t.cnt; });
    return { pcs, wg, cnt, months };
}
function allTotal(data) {
    let pcs = 0, wg = 0;
    data.parties.forEach(p => { const t = partyTotal(p); pcs += t.pcs; wg += t.wg; });
    return { pcs, wg, parties: data.parties.length };
}

// ===== STATE =====
let data = load();
let curPartyId = null;
let curMonthId = null;
let curSizeId = null;
let editId = null; // reused for editing party/month/size
let editEntryIdx = null;
let curUnit = 'kg';
let pendingImage = null;

// ===== SPLASH =====
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('splash').classList.add('hide');
        showScreen('screen-parties');
        renderParties();
    }, 900);
});

// ===== NAV =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
function navTo(screen) {
    switch (screen) {
        case 'parties':
            curPartyId = curMonthId = curSizeId = null;
            showScreen('screen-parties');
            renderParties();
            break;
        case 'months':
            curMonthId = curSizeId = null;
            showScreen('screen-months');
            renderMonths();
            break;
        case 'sizes':
            curSizeId = null;
            showScreen('screen-sizes');
            renderSizes();
            break;
        case 'entries':
            showScreen('screen-entries');
            renderEntries();
            break;
    }
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeBg(e, id) { if (e.target === e.currentTarget) closeModal(id); }
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}
function confirmDel(msg, onOk) {
    document.getElementById('del-msg').textContent = msg;
    document.getElementById('btn-del-ok').onclick = onOk;
    openModal('m-del');
}

// ===== FINDERS =====
function getParty() { return data.parties.find(p => p.id === curPartyId); }
function getMonth() { const p = getParty(); return p ? p.months.find(m => m.id === curMonthId) : null; }
function getSize() { const m = getMonth(); return m ? m.sizes.find(s => s.id === curSizeId) : null; }

// =================================================================
// SCREEN 1: PARTIES
// =================================================================
function renderParties() {
    const list = document.getElementById('party-list');
    const si = document.getElementById('search-inp');
    const q = si ? si.value.toLowerCase() : '';
    const filtered = data.parties.filter(p => p.name.toLowerCase().includes(q));

    // Global stats
    const gs = document.getElementById('global-stats');
    const sw = document.getElementById('search-wrap');
    if (data.parties.length > 0) {
        gs.classList.remove('hidden');
        const t = allTotal(data);
        document.getElementById('gs-parties').textContent = t.parties;
        document.getElementById('gs-pcs').textContent = fmtNum(t.pcs);
        document.getElementById('gs-wt').textContent = fmtWtKg(t.wg);
    } else gs.classList.add('hidden');
    if (data.parties.length > 2) sw.classList.remove('hidden'); else sw.classList.add('hidden');

    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-box"><span class="empty-icon">🧺</span>
            <div class="empty-title">${q ? 'No results' : 'No Parties Yet'}</div>
            <div class="empty-sub">${q ? 'Try a different search' : 'Tap + to create your first party'}</div></div>`;
        return;
    }

    list.innerHTML = filtered.map(p => {
        const t = partyTotal(p);
        return `<div class="pcard" onclick="openPartyScreen('${p.id}')">
            <button class="pcard-del" onclick="event.stopPropagation();delParty('${p.id}')" title="Delete">✕</button>
            <div class="pcard-top">
                <span class="pcard-name">${escHtml(p.name)}</span>
                <span class="pcard-badge">${t.months} mo</span>
            </div>
            <div class="pcard-stats">
                <div class="pcard-stat"><div class="pcard-stat-val">${fmtNum(t.pcs)}</div><div class="pcard-stat-lbl">Pieces</div></div>
                <div class="pcard-stat"><div class="pcard-stat-val">${fmtWtKg(t.wg)}</div><div class="pcard-stat-lbl">Weight</div></div>
                <div class="pcard-stat"><div class="pcard-stat-val">${t.cnt}</div><div class="pcard-stat-lbl">Entries</div></div>
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
    renderParties(); si.focus();
}

// Party CRUD
function openPartyModal(isEdit) {
    if (isEdit && curPartyId) {
        const p = getParty();
        if (!p) return;
        editId = p.id;
        document.getElementById('m-party-title').textContent = 'Edit Party';
        document.getElementById('ip-name').value = p.name;
    } else {
        editId = null;
        document.getElementById('m-party-title').textContent = 'New Party';
        document.getElementById('f-party').reset();
    }
    openModal('m-party');
    setTimeout(() => document.getElementById('ip-name').focus(), 300);
}
function saveParty(e) {
    e.preventDefault();
    const name = document.getElementById('ip-name').value.trim();
    if (!name) return;
    if (editId) {
        const p = data.parties.find(x => x.id === editId);
        if (p) p.name = name;
        toast('Party updated ✓');
    } else {
        data.parties.unshift({ id: genId(), name, months: [] });
        toast('Party created ✓');
    }
    save(data); closeModal('m-party');
    renderParties();
    if (curPartyId) document.getElementById('month-hdr-name').textContent = getParty()?.name || '';
}
function delParty(id) {
    const p = data.parties.find(x => x.id === id);
    if (!p) return;
    const t = partyTotal(p);
    confirmDel(`Delete "${p.name}" and all its ${t.cnt} entries?`, () => {
        data.parties = data.parties.filter(x => x.id !== id);
        save(data); closeModal('m-del'); toast('Party deleted');
        if (curPartyId === id) navTo('parties'); else renderParties();
    });
}
function openPartyScreen(id) {
    curPartyId = id;
    navTo('months');
}

// =================================================================
// SCREEN 2: MONTHS
// =================================================================
function renderMonths() {
    const p = getParty();
    if (!p) return;
    document.getElementById('month-hdr-name').textContent = p.name;

    // Stats
    const ps = document.getElementById('party-stats');
    if (p.months.length > 0) {
        ps.classList.remove('hidden');
        const t = partyTotal(p);
        document.getElementById('ps-months').textContent = t.months;
        document.getElementById('ps-pcs').textContent = fmtNum(t.pcs);
        document.getElementById('ps-wt').textContent = fmtWtKg(t.wg);
    } else ps.classList.add('hidden');

    const list = document.getElementById('month-list');
    if (p.months.length === 0) {
        list.innerHTML = `<div class="empty-box"><span class="empty-icon">📅</span>
            <div class="empty-title">No Months Yet</div>
            <div class="empty-sub">Tap + to add a month</div></div>`;
        return;
    }
    list.innerHTML = p.months.map(mo => {
        const t = monthTotal(mo);
        return `<div class="pcard" onclick="openMonthScreen('${mo.id}')">
            <button class="pcard-del" onclick="event.stopPropagation();delMonth('${mo.id}')" title="Delete">✕</button>
            <div class="pcard-top">
                <span class="pcard-name">📅 ${escHtml(mo.name)}</span>
                <span class="pcard-badge">${t.sizes} sizes</span>
            </div>
            <div class="pcard-stats">
                <div class="pcard-stat"><div class="pcard-stat-val">${fmtNum(t.pcs)}</div><div class="pcard-stat-lbl">Pieces</div></div>
                <div class="pcard-stat"><div class="pcard-stat-val">${fmtWtKg(t.wg)}</div><div class="pcard-stat-lbl">Weight</div></div>
                <div class="pcard-stat"><div class="pcard-stat-val">${t.cnt}</div><div class="pcard-stat-lbl">Entries</div></div>
            </div>
        </div>`;
    }).join('');
}

function openMonthModal(isEdit) {
    const now = new Date();
    const defaultVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (isEdit && curMonthId) {
        const mo = getMonth();
        if (!mo) return;
        editId = mo.id;
        document.getElementById('m-month-title').textContent = 'Edit Month';
        document.getElementById('im-month').value = mo.raw || defaultVal;
    } else {
        editId = null;
        document.getElementById('m-month-title').textContent = 'Add Month';
        document.getElementById('f-month').reset();
        document.getElementById('im-month').value = defaultVal;
    }
    openModal('m-month');
}
function saveMonth(e) {
    e.preventDefault();
    const raw = document.getElementById('im-month').value;
    if (!raw) return;
    const name = fmtMonthInput(raw);
    const p = getParty();
    if (!p) return;
    if (editId) {
        const mo = p.months.find(x => x.id === editId);
        if (mo) { mo.name = name; mo.raw = raw; }
        toast('Month updated ✓');
    } else {
        p.months.push({ id: genId(), name, raw, sizes: [] });
        toast('Month added ✓');
    }
    save(data); closeModal('m-month'); renderMonths();
    if (curMonthId) {
        document.getElementById('size-hdr-name').textContent = getMonth()?.name || '';
    }
}
function delMonth(id) {
    const p = getParty();
    const mo = p.months.find(x => x.id === id);
    if (!mo) return;
    const t = monthTotal(mo);
    confirmDel(`Delete "${mo.name}" and all ${t.cnt} entries?`, () => {
        p.months = p.months.filter(x => x.id !== id);
        save(data); closeModal('m-del'); toast('Month deleted');
        if (curMonthId === id) navTo('months'); else renderMonths();
    });
}
function openMonthScreen(id) {
    curMonthId = id;
    navTo('sizes');
}

// =================================================================
// SCREEN 3: SIZES
// =================================================================
function renderSizes() {
    const p = getParty();
    const mo = getMonth();
    if (!p || !mo) return;
    document.getElementById('size-hdr-name').textContent = p.name;
    document.getElementById('size-hdr-sub').textContent = '📅 ' + mo.name;

    const ms = document.getElementById('month-stats');
    if (mo.sizes.length > 0) {
        ms.classList.remove('hidden');
        const t = monthTotal(mo);
        document.getElementById('ms-sizes').textContent = t.sizes;
        document.getElementById('ms-pcs').textContent = fmtNum(t.pcs);
        document.getElementById('ms-wt').textContent = fmtWtKg(t.wg);
    } else ms.classList.add('hidden');

    const list = document.getElementById('size-list');
    if (mo.sizes.length === 0) {
        list.innerHTML = `<div class="empty-box"><span class="empty-icon">📐</span>
            <div class="empty-title">No Sizes Yet</div>
            <div class="empty-sub">Tap + to add a towel size</div></div>`;
        return;
    }
    list.innerHTML = mo.sizes.map(sz => {
        const t = sizeTotal(sz);
        return `<div class="pcard" onclick="openSizeScreen('${sz.id}')">
            <button class="pcard-del" onclick="event.stopPropagation();delSize('${sz.id}')" title="Delete">✕</button>
            <div class="pcard-top">
                <span class="pcard-name">📐 ${escHtml(sz.name)}</span>
                <span class="pcard-badge">${t.cnt} entries</span>
            </div>
            <div class="pcard-stats">
                <div class="pcard-stat"><div class="pcard-stat-val">${fmtNum(t.pcs)}</div><div class="pcard-stat-lbl">Pieces</div></div>
                <div class="pcard-stat"><div class="pcard-stat-val">${fmtWtKg(t.wg)}</div><div class="pcard-stat-lbl">Weight</div></div>
                <div class="pcard-stat"><div class="pcard-stat-val">${t.cnt}</div><div class="pcard-stat-lbl">Entries</div></div>
            </div>
        </div>`;
    }).join('');
}

function openSizeModal(isEdit) {
    if (isEdit && curSizeId) {
        const sz = getSize();
        if (!sz) return;
        editId = sz.id;
        document.getElementById('m-size-title').textContent = 'Edit Size';
        document.getElementById('is-size').value = sz.name;
    } else {
        editId = null;
        document.getElementById('m-size-title').textContent = 'Add Towel Size';
        document.getElementById('f-size').reset();
    }
    openModal('m-size');
    setTimeout(() => document.getElementById('is-size').focus(), 300);
}
function saveSize(e) {
    e.preventDefault();
    const name = document.getElementById('is-size').value.trim();
    if (!name) return;
    const mo = getMonth();
    if (!mo) return;
    if (editId) {
        const sz = mo.sizes.find(x => x.id === editId);
        if (sz) sz.name = name;
        toast('Size updated ✓');
    } else {
        mo.sizes.push({ id: genId(), name, entries: [] });
        toast('Size added ✓');
    }
    save(data); closeModal('m-size'); renderSizes();
    if (curSizeId) updateEntryHeader();
}
function delSize(id) {
    const mo = getMonth();
    const sz = mo.sizes.find(x => x.id === id);
    if (!sz) return;
    const t = sizeTotal(sz);
    confirmDel(`Delete size "${sz.name}" and all ${t.cnt} entries?`, () => {
        mo.sizes = mo.sizes.filter(x => x.id !== id);
        save(data); closeModal('m-del'); toast('Size deleted');
        if (curSizeId === id) navTo('sizes'); else renderSizes();
    });
}
function openSizeScreen(id) {
    curSizeId = id;
    navTo('entries');
}

// =================================================================
// SCREEN 4: ENTRIES
// =================================================================
function updateEntryHeader() {
    const p = getParty();
    const mo = getMonth();
    const sz = getSize();
    if (!p || !mo || !sz) return;
    document.getElementById('e-title').textContent = `📐 ${sz.name}`;
    document.getElementById('e-sub').textContent = `${p.name} › ${mo.name}`;
}

function renderEntries() {
    const sz = getSize();
    if (!sz) return;
    updateEntryHeader();

    const t = sizeTotal(sz);
    document.getElementById('t-pcs').textContent = fmtNum(t.pcs);
    document.getElementById('t-wt').textContent = fmtWtKg(t.wg);
    document.getElementById('t-cnt').textContent = t.cnt;

    const ab = document.getElementById('avg-bar');
    if (t.cnt > 0) {
        ab.style.display = '';
        document.getElementById('a-pcs').textContent = Math.round(t.pcs / t.cnt);
        document.getElementById('a-wt').textContent = fmtWtKg(Math.round(t.wg / t.cnt));
        document.getElementById('a-wpc').textContent = t.pcs > 0 ? Math.round(t.wg / t.pcs) + ' g' : '—';
    } else ab.style.display = 'none';

    const tbody = document.getElementById('etbody');
    if (t.cnt === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text3);">
            <span style="font-size:36px;display:block;margin-bottom:8px;">📝</span>
            No entries yet. Tap <strong>+</strong> to add.</td></tr>`;
        return;
    }
    tbody.innerHTML = sz.entries.map((e, i) => `<tr>
        <td><span class="entry-idx">${i + 1}</span></td>
        <td class="td-img">${e.img
            ? `<img class="entry-thumb" src="${e.img}" onclick="viewImage(${i})" alt="#${i + 1}">`
            : `<div class="no-img-icon">📷</div>`}</td>
        <td class="td-pcs">${fmtNum(e.pcs)} pcs</td>
        <td class="td-wt">${fmtWt(e.wg)}</td>
        <td class="td-wpc">${e.pcs > 0 ? fmtWt(Math.round(e.wg / e.pcs)) : '—'}</td>
        <td class="td-act">
            <button class="act-btn" onclick="openEditEntry(${i})" title="Edit">✏️</button>
            <button class="act-btn" onclick="confirmDelEntry(${i})" title="Delete">🗑️</button>
        </td>
    </tr>`).join('');
}

// ===== IMAGE =====
function compressImage(file, maxW, quality) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}
function triggerImagePick() { document.getElementById('ie-img').click(); }
async function onImagePicked(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    pendingImage = await compressImage(file, 600, 0.6);
    showImagePreview(pendingImage);
}
function showImagePreview(src) {
    const wrap = document.getElementById('img-preview-wrap');
    const img = document.getElementById('img-preview');
    if (src) { img.src = src; wrap.classList.remove('empty'); }
    else { img.src = ''; wrap.classList.add('empty'); }
}
function removeImage(ev) {
    ev.stopPropagation(); pendingImage = null;
    document.getElementById('ie-img').value = '';
    showImagePreview(null);
}
function viewImage(idx) {
    const sz = getSize();
    if (!sz || !sz.entries[idx] || !sz.entries[idx].img) return;
    document.getElementById('imgview-img').src = sz.entries[idx].img;
    openModal('m-imgview');
}

// ===== ENTRY CRUD =====
function openEntryModal() {
    editEntryIdx = null;
    document.getElementById('m-entry-title').textContent = 'Add Entry';
    document.getElementById('f-entry').reset();
    curUnit = 'kg'; pendingImage = null;
    showImagePreview(null); syncUnitUI();
    openModal('m-entry');
    setTimeout(() => document.getElementById('ie-pcs').focus(), 300);
}
function openEditEntry(idx) {
    const sz = getSize();
    if (!sz || !sz.entries[idx]) return;
    editEntryIdx = idx;
    const e = sz.entries[idx];
    document.getElementById('m-entry-title').textContent = `Edit Entry #${idx + 1}`;
    document.getElementById('ie-pcs').value = e.pcs;
    const bu = bestUnit(e.wg);
    document.getElementById('ie-wt').value = bu.val;
    curUnit = bu.unit;
    pendingImage = e.img || null;
    showImagePreview(pendingImage); syncUnitUI();
    openModal('m-entry');
}
function setUnit(u) {
    const inp = document.getElementById('ie-wt');
    const val = parseFloat(inp.value);
    if (!isNaN(val) && val > 0) {
        if (curUnit === 'kg' && u === 'g') inp.value = Math.round(val * 1000);
        if (curUnit === 'g' && u === 'kg') inp.value = (val / 1000);
    }
    curUnit = u; syncUnitUI();
}
function syncUnitUI() {
    document.querySelectorAll('.ubtn').forEach(b => b.classList.toggle('active', b.dataset.u === curUnit));
    document.getElementById('ie-wt').placeholder = curUnit === 'kg' ? 'e.g. 19.5' : 'e.g. 11500';
}
function qw(v) { curUnit = 'kg'; syncUnitUI(); document.getElementById('ie-wt').value = v; }

function saveEntry(e) {
    e.preventDefault();
    const pcs = parseInt(document.getElementById('ie-pcs').value, 10);
    const wtVal = parseFloat(document.getElementById('ie-wt').value);
    if (!pcs || pcs <= 0) return toast('Enter valid pieces');
    if (!wtVal || wtVal <= 0) return toast('Enter valid weight');
    const wg = toGrams(wtVal, curUnit);
    const sz = getSize();
    if (!sz) return;
    if (editEntryIdx !== null) {
        sz.entries[editEntryIdx] = { pcs, wg, img: pendingImage || sz.entries[editEntryIdx].img || null };
        toast('Entry updated ✓');
    } else {
        sz.entries.push({ pcs, wg, img: pendingImage || null });
        toast('Entry added ✓');
    }
    pendingImage = null;
    save(data); closeModal('m-entry'); renderEntries(); editEntryIdx = null;
}
function confirmDelEntry(idx) {
    const sz = getSize();
    if (!sz) return;
    const e = sz.entries[idx];
    confirmDel(`Delete entry #${idx + 1} (${e.pcs} pcs, ${fmtWt(e.wg)})?`, () => {
        sz.entries.splice(idx, 1);
        save(data); closeModal('m-del'); renderEntries(); toast('Entry deleted');
    });
}

// ===== SHARE =====
function shareReport() {
    const p = getParty(); const mo = getMonth(); const sz = getSize();
    if (!p || !mo || !sz) return;
    const t = sizeTotal(sz);
    let txt = `📋 ${p.name}\n📅 ${mo.name} | 📐 ${sz.name}\n`;
    txt += '━'.repeat(30) + '\n';
    sz.entries.forEach((e, i) => {
        const wpc = e.pcs > 0 ? Math.round(e.wg / e.pcs) + 'g/pc' : '';
        txt += `${(i + 1).toString().padStart(2)}) ${fmtNum(e.pcs).padStart(6)} pcs  ${fmtWt(e.wg).padStart(10)}  ${wpc}\n`;
    });
    txt += '━'.repeat(30) + '\n';
    txt += `Total: ${fmtNum(t.pcs)} pcs | ${fmtWtKg(t.wg)}\nEntries: ${t.cnt}`;
    if (navigator.share) navigator.share({ title: `${p.name} - ${sz.name}`, text: txt }).catch(() => {});
    else navigator.clipboard.writeText(txt).then(() => toast('Copied to clipboard!'));
}

// ===== EXPORT ALL =====
function exportAllData() {
    if (data.parties.length === 0) return toast('No data to export');
    let txt = '🧺 TOWEL TRACKER - FULL REPORT\n' + '═'.repeat(35) + '\n\n';
    data.parties.forEach(p => {
        const pt = partyTotal(p);
        txt += `🏭 ${p.name}  (${pt.months} months, ${fmtNum(pt.pcs)} pcs, ${fmtWtKg(pt.wg)})\n`;
        p.months.forEach(mo => {
            txt += `\n  📅 ${mo.name}\n`;
            mo.sizes.forEach(sz => {
                const st = sizeTotal(sz);
                txt += `    📐 ${sz.name}\n    ${'─'.repeat(26)}\n`;
                sz.entries.forEach((e, i) => {
                    txt += `    ${(i + 1).toString().padStart(3)}) ${fmtNum(e.pcs).padStart(6)} pcs  ${fmtWt(e.wg).padStart(10)}\n`;
                });
                txt += `    Total: ${fmtNum(st.pcs)} pcs | ${fmtWtKg(st.wg)}\n`;
            });
        });
        txt += '\n';
    });
    if (navigator.share) navigator.share({ title: 'Towel Tracker Report', text: txt }).catch(() => {});
    else navigator.clipboard.writeText(txt).then(() => toast('Full report copied!'));
}
