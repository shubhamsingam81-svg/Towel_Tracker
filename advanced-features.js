// =============================================
// ADVANCED FEATURES - Settings, Analytics, Filters
// =============================================

// ===== SETTINGS =====
let appSettings = {
    darkMode: false,
    exportFormat: 'xlsx',
    autoBackup: true,
    language: 'en',
    theme: 'auto'
};

function loadSettings() {
    try {
        const saved = localStorage.getItem('app_settings');
        if (saved) {
            appSettings = { ...appSettings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Error loading settings:', e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('app_settings', JSON.stringify(appSettings));
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

function toggleDarkMode() {
    appSettings.darkMode = !appSettings.darkMode;
    applyDarkMode();
    saveSettings();
    toast(appSettings.darkMode ? '🌙 Dark mode ON' : '☀️ Light mode ON');
}

function applyDarkMode() {
    const html = document.documentElement;
    if (appSettings.darkMode) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    // Update toggle button text if it exists
    const toggle = document.getElementById('dm-toggle');
    if (toggle) toggle.textContent = appSettings.darkMode ? 'ON' : 'OFF';
}

// ===== ANALYTICS & INSIGHTS =====
function getAnalytics() {
    const stats = {
        totalParties: data.parties.length,
        totalMonths: 0,
        totalSizes: 0,
        totalEntries: 0,
        totalPieces: 0,
        totalWeight: 0,
        avgPiecesPerEntry: 0,
        avgWeightPerEntry: 0,
        heaviestEntry: null,
        lightestEntry: null,
        busiest: null
    };

    data.parties.forEach(p => {
        const pt = partyTotal(p);
        stats.totalMonths += p.months.length;
        stats.totalPieces += pt.pcs;
        stats.totalWeight += pt.wg;
        
        p.months.forEach(m => {
            m.sizes.forEach(s => {
                stats.totalSizes += 1;
                s.entries.forEach(e => {
                    stats.totalEntries += 1;
                    if (!stats.heaviestEntry || e.wg > stats.heaviestEntry.wg) {
                        stats.heaviestEntry = { ...e, party: p.name, month: m.name, size: s.name };
                    }
                    if (!stats.lightestEntry || e.wg < stats.lightestEntry.wg) {
                        stats.lightestEntry = { ...e, party: p.name, month: m.name, size: s.name };
                    }
                });
            });
        });
        
        if (!stats.busiest || pt.cnt > stats.busiest.cnt) {
            stats.busiest = { name: p.name, count: pt.cnt, pieces: pt.pcs };
        }
    });

    if (stats.totalEntries > 0) {
        stats.avgPiecesPerEntry = (stats.totalPieces / stats.totalEntries).toFixed(2);
        stats.avgWeightPerEntry = (stats.totalWeight / stats.totalEntries).toFixed(0);
    }

    return stats;
}

function openAnalytics() {
    const analytics = getAnalytics();
    
    let html = `
        <h3 style="color: #5B61FF; margin: 0 0 16px 0; font-size: 18px; font-weight: 800;">📊 Analytics Dashboard</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #EEF2FF, #E0E7FF); padding: 12px; border-radius: 12px;">
                <div style="font-size: 11px; color: #5B61FF; font-weight: 700; text-transform: uppercase;">Total Parties</div>
                <div style="font-size: 24px; font-weight: 900; color: #5B61FF; margin-top: 4px;">${analytics.totalParties}</div>
            </div>
            <div style="background: linear-gradient(135deg, #ECFDF5, #D1FAE5); padding: 12px; border-radius: 12px;">
                <div style="font-size: 11px; color: #059669; font-weight: 700; text-transform: uppercase;">Total Entries</div>
                <div style="font-size: 24px; font-weight: 900; color: #059669; margin-top: 4px;">${analytics.totalEntries}</div>
            </div>
            <div style="background: linear-gradient(135deg, #FFFBEB, #FEF3C7); padding: 12px; border-radius: 12px;">
                <div style="font-size: 11px; color: #D97706; font-weight: 700; text-transform: uppercase;">Total Pieces</div>
                <div style="font-size: 24px; font-weight: 900; color: #D97706; margin-top: 4px;">${fmtNum(analytics.totalPieces)}</div>
            </div>
            <div style="background: linear-gradient(135deg, #FEF2F2, #FEE2E2); padding: 12px; border-radius: 12px;">
                <div style="font-size: 11px; color: #DC2626; font-weight: 700; text-transform: uppercase;">Total Weight</div>
                <div style="font-size: 24px; font-weight: 900; color: #DC2626; margin-top: 4px;">${fmtWtKg(analytics.totalWeight)}</div>
            </div>
        </div>
        
        <h4 style="color: #5B61FF; margin: 20px 0 12px 0; font-size: 14px; font-weight: 800;">Key Metrics</h4>
        <div style="background: #f8fafb; padding: 12px; border-radius: 10px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 13px; color: #475569;">Avg Pieces/Entry</span>
                <span style="font-weight: 700; color: #5B61FF;">${analytics.avgPiecesPerEntry}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="font-size: 13px; color: #475569;">Avg Weight/Entry</span>
                <span style="font-weight: 700; color: #5B61FF;">${fmtWt(analytics.avgWeightPerEntry)}</span>
            </div>
        </div>
    `;
    
    if (analytics.busiest) {
        html += `
            <h4 style="color: #5B61FF; margin: 16px 0 12px 0; font-size: 14px; font-weight: 800;">🏆 Busiest Party</h4>
            <div style="background: linear-gradient(135deg, #EEF2FF, #E0E7FF); padding: 12px; border-radius: 10px; margin-bottom: 14px;">
                <div style="font-weight: 700; color: #5B61FF; margin-bottom: 4px;">${analytics.busiest.name}</div>
                <div style="font-size: 12px; color: #475569;">📦 ${analytics.busiest.count} entries • ${fmtNum(analytics.busiest.pieces)} pieces</div>
            </div>
        `;
    }
    
    const analyticsModal = document.getElementById('m-analytics');
    if (analyticsModal) {
        analyticsModal.querySelector('.modal-content').innerHTML = html;
        openModal('m-analytics');
    }
}

// ===== ADVANCED SEARCH & FILTER =====
function advancedSearch(query) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase();
    const results = [];
    
    data.parties.forEach(party => {
        if (party.name.toLowerCase().includes(q)) {
            results.push({
                type: 'party',
                id: party.id,
                name: party.name,
                path: party.name
            });
        }
        
        party.months.forEach(month => {
            if (month.name.toLowerCase().includes(q)) {
                results.push({
                    type: 'month',
                    partyId: party.id,
                    monthId: month.id,
                    name: month.name,
                    path: `${party.name} > ${month.name}`
                });
            }
            
            month.sizes.forEach(size => {
                if (size.name.toLowerCase().includes(q)) {
                    results.push({
                        type: 'size',
                        partyId: party.id,
                        monthId: month.id,
                        sizeId: size.id,
                        name: size.name,
                        path: `${party.name} > ${month.name} > ${size.name}`
                    });
                }
            });
        });
    });
    
    return results.slice(0, 8);
}

function navigateToResult(result) {
    if (result.type === 'party') {
        curPartyId = result.id;
        navTo('months');
    } else if (result.type === 'month') {
        curPartyId = result.partyId;
        curMonthId = result.monthId;
        navTo('sizes');
    } else if (result.type === 'size') {
        curPartyId = result.partyId;
        curMonthId = result.monthId;
        curSizeId = result.sizeId;
        navTo('entries');
    }
}

// ===== DATA BACKUP & RESTORE =====
function backupData() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '3.0',
            data: data
        };
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `towel-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('✓ Data backed up');
    } catch (e) {
        toast('Error: ' + e.message);
    }
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) { toast('File too large (max 50MB)'); return; }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target.result);
                const d = backup.data || backup;
                if (!d || !Array.isArray(d.parties)) { toast('Invalid backup: no parties array found'); return; }
                // Validate structure
                let valid = true;
                d.parties.forEach(p => {
                    if (!p.id || !p.name || !Array.isArray(p.months)) valid = false;
                    if (valid) p.months.forEach(m => {
                        if (!m.id || !m.name || !Array.isArray(m.sizes)) valid = false;
                        if (valid) m.sizes.forEach(s => {
                            if (!s.id || !s.name || !Array.isArray(s.entries)) valid = false;
                        });
                    });
                });
                if (!valid) { toast('Invalid backup: corrupted data structure'); return; }
                // Keep a backup before overwriting
                const prevData = JSON.stringify(data);
                data = d;
                save(data);
                renderParties();
                toastUndo('✓ Data restored (' + d.parties.length + ' parties)', () => {
                    data = JSON.parse(prevData);
                    save(data);
                    renderParties();
                });
            } catch (err) {
                toast('Error: invalid JSON file');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applyDarkMode();
});
