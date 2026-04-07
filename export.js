// =============================================
// EXPORT FUNCTIONS - PDF & EXCEL
// =============================================

// Wait for libraries to load
let libsReady = false;
let loadAttempts = 0;

function checkAndWaitForLibs() {
    if (typeof XLSX !== 'undefined' && typeof html2pdf !== 'undefined') {
        libsReady = true;
        console.log('Export libraries loaded successfully');
        return true;
    }
    
    loadAttempts++;
    if (loadAttempts < 20) {
        setTimeout(checkAndWaitForLibs, 500);
    }
    return false;
}

// Start checking on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndWaitForLibs);
} else {
    checkAndWaitForLibs();
}

// Check if libraries are loaded
function checkLibraries() {
    if (typeof XLSX === 'undefined') {
        toast('Loading Excel library...');
        console.error('XLSX not loaded');
        return false;
    }
    if (typeof html2pdf === 'undefined') {
        toast('Loading PDF library...');
        console.error('html2pdf not loaded');
        return false;
    }
    return true;
}

// ===== EXPORT ALL DATA TO EXCEL =====
function exportAllDataExcel() {
    if (!checkLibraries()) {
        toast('⏳ Waiting for libraries...');
        setTimeout(exportAllDataExcel, 1000);
        return;
    }
    
    if (!data || data.parties.length === 0) {
        toast('No data to export');
        return;
    }

    try {
        const workbook = XLSX.utils.book_new();
        const summaryData = [];
        
        summaryData.push(['TOWEL TRACKER - SUMMARY REPORT']);
        summaryData.push(['Generated on', new Date().toLocaleString('en-IN')]);
        summaryData.push(['']);
        summaryData.push(['Total Parties', data.parties.length]);
        
        let totalPcs = 0, totalWt = 0;
        data.parties.forEach(p => {
            const t = partyTotal(p);
            totalPcs += t.pcs;
            totalWt += t.wg;
        });
        
        summaryData.push(['Total Pieces', totalPcs]);
        summaryData.push(['Total Weight (kg)', (totalWt / 1000).toFixed(2)]);
        summaryData.push(['']);
        summaryData.push(['Party Details']);
        summaryData.push(['Party Name', 'Months', 'Entries', 'Total Pieces', 'Total Weight (kg)']);
        
        data.parties.forEach(p => {
            const t = partyTotal(p);
            summaryData.push([
                p.name,
                t.months,
                t.cnt,
                t.pcs,
                (t.wg / 1000).toFixed(2)
            ]);
        });
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        
        // Detailed sheets for each party
        data.parties.forEach(party => {
            const detailData = [];
            detailData.push([`PARTY: ${party.name}`]);
            detailData.push(['Generated', new Date().toLocaleString('en-IN')]);
            detailData.push(['']);
            
            party.months.forEach(month => {
                detailData.push([`Month: ${month.name}`]);
                detailData.push(['Size', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Count']);
                
                month.sizes.forEach(size => {
                    const st = sizeTotal(size);
                    detailData.push([
                        size.name,
                        st.pcs,
                        st.wg,
                        (st.wg / 1000).toFixed(3),
                        st.cnt
                    ]);
                });
                
                const mt = monthTotal(month);
                detailData.push(['MONTH TOTAL', mt.pcs, mt.wg, (mt.wg / 1000).toFixed(3), mt.cnt]);
                detailData.push(['']);
            });
            
            const pt = partyTotal(party);
            detailData.push(['PARTY TOTAL', pt.pcs, pt.wg, (pt.wg / 1000).toFixed(3), pt.cnt]);
            
            const sheet = XLSX.utils.aoa_to_sheet(detailData);
            sheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
            XLSX.utils.book_append_sheet(workbook, sheet, party.name.substring(0, 31).replace(/[\/\?\*\[\]]/g, ''));
        });
        
        const fileName = `TowelTracker_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast('✓ Exported to Excel');
    } catch (error) {
        console.error('Export Excel Error:', error);
        toast('Error exporting to Excel');
    }
}

// ===== EXPORT SINGLE PARTY TO EXCEL =====
function exportPartyExcel() {
    if (!checkLibraries()) {
        toast('⏳ Waiting for libraries...');
        setTimeout(exportPartyExcel, 1000);
        return;
    }
    
    const party = getParty();
    if (!party) {
        toast('Select a party first');
        return;
    }

    try {
        const workbook = XLSX.utils.book_new();
        const detailData = [];
        
        detailData.push([`TOWEL TRACKER - PARTY REPORT`]);
        detailData.push(['Party Name', party.name]);
        detailData.push(['Generated', new Date().toLocaleString('en-IN')]);
        detailData.push(['']);
        
        const pt = partyTotal(party);
        detailData.push(['Party Summary']);
        detailData.push(['Total Months', pt.months]);
        detailData.push(['Total Entries', pt.cnt]);
        detailData.push(['Total Pieces', pt.pcs]);
        detailData.push(['Total Weight (kg)', (pt.wg / 1000).toFixed(2)]);
        detailData.push(['']);
        
        party.months.forEach(month => {
            detailData.push([`Month: ${month.name}`]);
            detailData.push(['Size', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Count']);
            
            month.sizes.forEach(size => {
                const st = sizeTotal(size);
                detailData.push([
                    size.name,
                    st.pcs,
                    st.wg,
                    (st.wg / 1000).toFixed(3),
                    st.cnt
                ]);
            });
            
            const mt = monthTotal(month);
            detailData.push(['Month Total', mt.pcs, mt.wg, (mt.wg / 1000).toFixed(3), mt.cnt]);
            detailData.push(['']);
        });
        
        const sheet = XLSX.utils.aoa_to_sheet(detailData);
        sheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
        
        XLSX.utils.book_append_sheet(workbook, sheet, party.name.substring(0, 31).replace(/[\/\?\*\[\]]/g, ''));
        
        const fileName = `${party.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast('✓ Exported to Excel');
    } catch (error) {
        console.error('Export Error:', error);
        toast('Error exporting to Excel');
    }
}

// ===== EXPORT SIZE DATA TO EXCEL =====
function exportSizeExcel() {
    if (!checkLibraries()) {
        toast('⏳ Waiting for libraries...');
        setTimeout(exportSizeExcel, 1000);
        return;
    }
    
    const party = getParty();
    const month = getMonth();
    const size = getSize();
    
    if (!party || !month || !size) {
        toast('Navigate to size/entries first');
        return;
    }

    try {
        const st = sizeTotal(size);
        const wb = XLSX.utils.book_new();
        const data_arr = [];
        
        data_arr.push(['TOWEL TRACKER - DATA EXPORT']);
        data_arr.push(['Party', party.name]);
        data_arr.push(['Month', month.name]);
        data_arr.push(['Size', size.name]);
        data_arr.push(['Generated', new Date().toLocaleString('en-IN')]);
        data_arr.push(['']);
        data_arr.push(['#', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Wt/Piece (g)']);
        
        size.entries.forEach((entry, idx) => {
            const wpc = entry.pcs > 0 ? (entry.wg / entry.pcs).toFixed(2) : 0;
            data_arr.push([idx + 1, entry.pcs, entry.wg, (entry.wg / 1000).toFixed(3), wpc]);
        });
        
        data_arr.push(['']);
        data_arr.push(['TOTAL', st.pcs, st.wg, (st.wg / 1000).toFixed(3), st.pcs > 0 ? (st.wg / st.pcs).toFixed(2) : 0]);
        
        const ws = XLSX.utils.aoa_to_sheet(data_arr);
        ws['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, size.name.substring(0, 31).replace(/[\/\?\*\[\]]/g, ''));
        
        const fileName = `${size.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast('✓ Exported to Excel');
    } catch (error) {
        console.error('Export Error:', error);
        toast('Error exporting to Excel');
    }
}

// ===== EXPORT ALL DATA TO PDF =====
function exportAllDataPDF() {
    if (!checkLibraries()) {
        toast('⏳ Waiting for libraries...');
        setTimeout(exportAllDataPDF, 1000);
        return;
    }
    
    if (!data || data.parties.length === 0) {
        toast('No data to export');
        return;
    }

    try {
        const element = document.createElement('div');
        
        let html = `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                    h1 { text-align: center; color: #4F46E5; font-size: 28px; margin: 0; }
                    h2 { color: #4F46E5; margin: 25px 0 15px 0; font-size: 18px; }
                    h3 { color: #333; margin: 12px 0 8px 0; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { padding: 8px; border: 1px solid #ccc; text-align: left; font-size: 12px; }
                    th { background-color: #e8eaf6; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .header-info { text-align: center; color: #666; margin: 10px 0 20px 0; }
                    .party-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; background: #fafafa; page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <h1>TOWEL TRACKER</h1>
                <div class="header-info">Complete Data Report</div>
                <div class="header-info" style="font-size: 11px;">Generated: ${new Date().toLocaleString('en-IN')}</div>
                
                <h2>Summary Statistics</h2>
                <table>
                    <tr><th>Metric</th><th style="text-align: right;">Value</th></tr>
        `;
        
        const totalData = allTotal(data);
        html += `
                    <tr><td>Total Parties</td><td style="text-align: right;">${totalData.parties}</td></tr>
                    <tr><td>Total Pieces</td><td style="text-align: right;">${fmtNum(totalData.pcs)}</td></tr>
                    <tr><td>Total Weight</td><td style="text-align: right;">${fmtWtKg(totalData.wg)}</td></tr>
                </table>
        `;
        
        html += '<h2>Party Details</h2>';
        
        data.parties.forEach((party, idx) => {
            const pt = partyTotal(party);
            html += `
                <div class="party-section">
                    <h3>${idx + 1}. ${escHtml(party.name)}</h3>
                    <table>
                        <tr><th>Metric</th><th style="text-align: right;">Value</th></tr>
                        <tr><td>Months</td><td style="text-align: right;">${pt.months}</td></tr>
                        <tr><td>Entries</td><td style="text-align: right;">${pt.cnt}</td></tr>
                        <tr><td>Pieces</td><td style="text-align: right;">${fmtNum(pt.pcs)}</td></tr>
                        <tr><td>Weight</td><td style="text-align: right;">${fmtWtKg(pt.wg)}</td></tr>
                    </table>
                </div>
            `;
        });
        
        html += `</body></html>`;
        element.innerHTML = html;
        
        const opt = {
            margin: 10,
            filename: `TowelTracker_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        html2pdf().set(opt).from(element).save();
        toast('✓ PDF exported');
    } catch (error) {
        console.error('PDF Error:', error);
        toast('Error: ' + error.message);
    }
}

// ===== EXPORT PARTY TO PDF =====
function exportPartyPDF() {
    if (!checkLibraries()) {
        toast('⏳ Waiting for libraries...');
        setTimeout(exportPartyPDF, 1000);
        return;
    }
    
    const party = getParty();
    if (!party) {
        toast('Select a party first');
        return;
    }

    try {
        const pt = partyTotal(party);
        const element = document.createElement('div');
        
        let html = `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                    h1 { text-align: center; color: #4F46E5; font-size: 28px; margin: 0; }
                    h2 { text-align: center; color: #666; margin: 5px 0 20px 0; font-size: 16px; }
                    h3 { color: #4F46E5; margin: 15px 0 10px 0; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { padding: 8px; border: 1px solid #ccc; text-align: left; font-size: 11px; }
                    th { background-color: #e8eaf6; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .summary { background-color: #f5f5f5; padding: 12px; margin: 12px 0; border-radius: 3px; }
                    .month-section { margin: 15px 0; padding: 12px; border: 1px solid #ddd; page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <h1>TOWEL TRACKER</h1>
                <h2>${escHtml(party.name)}</h2>
                <p style="text-align: center; color: #999; font-size: 11px;">Generated: ${new Date().toLocaleString('en-IN')}</p>
                
                <div class="summary">
                    <h3 style="margin-top: 0;">Party Summary</h3>
                    <table>
                        <tr><th>Metric</th><th style="text-align: right;">Value</th></tr>
                        <tr><td>Months</td><td style="text-align: right;">${pt.months}</td></tr>
                        <tr><td>Entries</td><td style="text-align: right;">${pt.cnt}</td></tr>
                        <tr><td>Pieces</td><td style="text-align: right;">${fmtNum(pt.pcs)}</td></tr>
                        <tr><td>Weight</td><td style="text-align: right;">${fmtWtKg(pt.wg)}</td></tr>
                    </table>
                </div>
        `;
        
        party.months.forEach((month) => {
            const mt = monthTotal(month);
            html += `
                <div class="month-section">
                    <h3 style="margin-top: 0;">📅 ${escHtml(month.name)}</h3>
                    <table>
                        <tr><th>Size</th><th style="text-align: center;">Pcs</th><th style="text-align: center;">Weight</th><th style="text-align: center;">Cnt</th></tr>
            `;
            
            month.sizes.forEach(size => {
                const st = sizeTotal(size);
                html += `<tr><td>${escHtml(size.name)}</td><td style="text-align: center;">${st.pcs}</td><td style="text-align: center;">${fmtWt(st.wg)}</td><td style="text-align: center;">${st.cnt}</td></tr>`;
            });
            
            html += `
                        <tr style="background-color: #e8f5e9; font-weight: bold;">
                            <td>Total</td><td style="text-align: center;">${mt.pcs}</td><td style="text-align: center;">${fmtWt(mt.wg)}</td><td style="text-align: center;">${mt.cnt}</td>
                        </tr>
                    </table>
                </div>
            `;
        });
        
        html += `</body></html>`;
        element.innerHTML = html;
        
        const opt = {
            margin: 10,
            filename: `${party.name}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        html2pdf().set(opt).from(element).save();
        toast('✓ PDF exported');
    } catch (error) {
        console.error('PDF Error:', error);
        toast('Error: ' + error.message);
    }
}

// ===== EXPORT SIZE DATA TO PDF =====
function exportSizePDF() {
    if (!checkLibraries()) {
        toast('⏳ Waiting for libraries...');
        setTimeout(exportSizePDF, 1000);
        return;
    }
    
    const party = getParty();
    const month = getMonth();
    const size = getSize();
    
    if (!party || !month || !size) {
        toast('Navigate to size/entries first');
        return;
    }

    try {
        const st = sizeTotal(size);
        const element = document.createElement('div');
        
        let avgPcs = st.cnt > 0 ? (st.pcs / st.cnt).toFixed(2) : 0;
        let avgWt = st.cnt > 0 ? (st.wg / st.cnt).toFixed(0) : 0;
        let wpc = st.pcs > 0 ? (st.wg / st.pcs).toFixed(2) : 0;
        
        let html = `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 15px; color: #333; }
                    h1 { text-align: center; color: #4F46E5; font-size: 24px; margin: 0; }
                    h3 { color: #4F46E5; margin: 12px 0 8px 0; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
                    th, td { padding: 6px; border: 1px solid #ccc; text-align: center; font-size: 10px; }
                    th { background-color: #4F46E5; color: white; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .info { background-color: #f5f5f5; padding: 8px; margin: 8px 0; border-radius: 3px; font-size: 10px; }
                    .stat { display: inline-block; width: 23%; margin: 3px 0.5%; padding: 6px; background: #e8eaf6; border-radius: 3px; font-size: 9px; }
                </style>
            </head>
            <body>
                <h1>TOWEL TRACKER</h1>
                <p style="text-align: center; color: #666; margin: 5px 0; font-size: 11px;">Entry Report</p>
                
                <div class="info">
                    <p style="margin: 2px 0;"><strong>Party:</strong> ${escHtml(party.name)}</p>
                    <p style="margin: 2px 0;"><strong>Month:</strong> ${escHtml(month.name)}</p>
                    <p style="margin: 2px 0;"><strong>Size:</strong> ${escHtml(size.name)}</p>
                    <p style="margin: 2px 0; font-size: 9px;">Generated: ${new Date().toLocaleString('en-IN')}</p>
                </div>
                
                <h3>Summary</h3>
                <div style="text-align: center;">
                    <div class="stat"><strong>Entries</strong><br><strong>${st.cnt}</strong></div>
                    <div class="stat"><strong>Pcs</strong><br><strong>${st.pcs}</strong></div>
                    <div class="stat"><strong>Weight</strong><br><strong>${fmtWt(st.wg)}</strong></div>
                    <div class="stat"><strong>Wt/Pc</strong><br><strong>${wpc}g</strong></div>
                </div>
                
                <h3>Entry Details</h3>
                <table>
                    <tr><th>#</th><th>Pcs</th><th>Wt(g)</th><th>Wt(kg)</th><th>Wt/Pc</th></tr>
        `;
        
        size.entries.forEach((entry, idx) => {
            const wpc_entry = entry.pcs > 0 ? (entry.wg / entry.pcs).toFixed(2) : 0;
            html += `<tr><td>${idx + 1}</td><td>${entry.pcs}</td><td>${entry.wg}</td><td>${(entry.wg / 1000).toFixed(2)}</td><td>${wpc_entry}</td></tr>`;
        });
        
        html += `
                    <tr style="background-color: #e8f5e9; font-weight: bold;">
                        <td>TOT</td><td>${st.pcs}</td><td>${st.wg}</td><td>${(st.wg / 1000).toFixed(2)}</td><td>${wpc}</td>
                    </tr>
                </table>
            </body>
            </html>
        `;
        
        element.innerHTML = html;
        
        const opt = {
            margin: 8,
            filename: `${size.name}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        html2pdf().set(opt).from(element).save();
        toast('✓ PDF exported');
    } catch (error) {
        console.error('PDF Error:', error);
        toast('Error: ' + error.message);
    }
}
