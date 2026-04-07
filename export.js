// =============================================
// EXPORT FUNCTIONS - PDF & EXCEL
// =============================================

// Helper function to create valid XLSX sheet names
function getValidSheetName(name, index = 1) {
    if (!name || typeof name !== 'string') {
        return `Sheet${index}`;
    }
    // Remove invalid characters and limit to 31 chars
    let clean = name.substring(0, 31)
        .replace(/[\[\]\/\?\*:]/g, '')  // Remove Excel-invalid chars
        .trim();
    
    // If result is empty, use fallback
    if (!clean || clean.length === 0) {
        return `Party${index}`;
    }
    
    return clean;
}

// Helper to ensure unique sheet names
function getUniqueSheetName(baseName, usedNames, index = 1) {
    let name = getValidSheetName(baseName, index);
    let counter = 1;
    let originalName = name;
    
    // If name already exists, append a number
    while (usedNames.has(name)) {
        name = originalName.substring(0, 25) + `_${counter}`;
        counter++;
    }
    
    usedNames.add(name);
    return name;
}

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
        
        summaryData.push(['ItemTracker - COMPLETE INVENTORY REPORT']);
        summaryData.push(['Generated', new Date().toLocaleString('en-IN')]);
        summaryData.push(['Report Type', 'Complete Data Export']);
        summaryData.push(['']);
        summaryData.push(['EXECUTIVE SUMMARY']);
        summaryData.push(['Total Parties', data.parties.length]);
        
        let totalPcs = 0, totalWt = 0;
        data.parties.forEach(p => {
            const t = partyTotal(p);
            totalPcs += t.pcs;
            totalWt += t.wg;
        });
        
        summaryData.push(['Total Pieces', totalPcs]);
        summaryData.push(['Total Weight (kg)', parseFloat((totalWt / 1000).toFixed(2))]);
        summaryData.push(['Average Weight/Piece (g)', totalPcs > 0 ? parseFloat((totalWt / totalPcs).toFixed(2)) : 0]);
        summaryData.push(['']);
        summaryData.push(['PARTY-WISE BREAKDOWN']);
        summaryData.push(['#', 'Party Name', 'Months', 'Entries', 'Total Pieces', 'Total Weight (kg)', 'Avg Wt/Pc (g)']);
        
        data.parties.forEach((p, idx) => {
            const t = partyTotal(p);
            const avgWpc = t.pcs > 0 ? parseFloat((t.wg / t.pcs).toFixed(2)) : 0;
            summaryData.push([
                idx + 1,
                p.name,
                t.months,
                t.cnt,
                t.pcs,
                parseFloat((t.wg / 1000).toFixed(2)),
                avgWpc
            ]);
        });
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        
        // Track used sheet names to avoid duplicates
        const usedSheetNames = new Set(['Summary']);
        
        // Detailed sheets for each party
        data.parties.forEach((party, pIdx) => {
            const detailData = [];
            const pt = partyTotal(party);
            
            detailData.push([`Party ${pIdx + 1} - ${party.name}`]);
            detailData.push(['Generated', new Date().toLocaleString('en-IN')]);
            detailData.push(['']);
            detailData.push(['Party Summary']);
            detailData.push(['Months', pt.months, 'Entries', pt.cnt]);
            detailData.push(['Total Pieces', pt.pcs, 'Total Weight (kg)', parseFloat((pt.wg / 1000).toFixed(2))]);
            detailData.push(['Average Wt per Piece (g)', pt.pcs > 0 ? parseFloat((pt.wg / pt.pcs).toFixed(2)) : 0]);
            detailData.push(['']);
            detailData.push(['MONTH-WISE DETAILS']);
            
            party.months.forEach((month, mIdx) => {
                const mt = monthTotal(month);
                detailData.push([`Month ${mIdx + 1} - ${month.name}`]);
                detailData.push(['Size', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Count', 'Wt/Piece (g)']);
                
                month.sizes.forEach(size => {
                    const st = sizeTotal(size);
                    const wpc = st.pcs > 0 ? parseFloat((st.wg / st.pcs).toFixed(2)) : 0;
                    detailData.push([
                        size.name,
                        st.pcs,
                        st.wg,
                        parseFloat((st.wg / 1000).toFixed(3)),
                        st.cnt,
                        wpc
                    ]);
                });
                
                const mtAvg = mt.pcs > 0 ? parseFloat((mt.wg / mt.pcs).toFixed(2)) : 0;
                detailData.push(['MONTH TOTAL', mt.pcs, mt.wg, parseFloat((mt.wg / 1000).toFixed(3)), mt.cnt, mtAvg]);
                detailData.push(['']);
            });
            
            const ptAvg = pt.pcs > 0 ? parseFloat((pt.wg / pt.pcs).toFixed(2)) : 0;
            detailData.push(['PARTY TOTAL', pt.pcs, pt.wg, parseFloat((pt.wg / 1000).toFixed(3)), pt.cnt, ptAvg]);
            
            const sheet = XLSX.utils.aoa_to_sheet(detailData);
            sheet['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
            const sheetName = getUniqueSheetName(party.name, usedSheetNames, pIdx + 1);
            XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
        });
        
        const fileName = `TowelTracker_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast('✓ Excel exported successfully');
    } catch (error) {
        console.error('Export Excel Error:', error);
        toast('Error: ' + error.message);
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
        
        const pt = partyTotal(party);
        
        detailData.push(['ItemTracker - PARTY DETAILED REPORT']);
        detailData.push(['Party Name', party.name]);
        detailData.push(['Generated', new Date().toLocaleString('en-IN')]);
        detailData.push(['']);
        detailData.push(['PARTY SUMMARY METRICS']);
        detailData.push(['Metric', 'Value']);
        detailData.push(['Total Months', pt.months]);
        detailData.push(['Total Entries', pt.cnt]);
        detailData.push(['Total Pieces', pt.pcs]);
        detailData.push(['Total Weight (kg)', parseFloat((pt.wg / 1000).toFixed(2))]);
        detailData.push(['Average Weight per Piece (g)', pt.pcs > 0 ? parseFloat((pt.wg / pt.pcs).toFixed(2)) : 0]);
        detailData.push(['']);
        detailData.push(['MONTH-WISE BREAKDOWN']);
        
        party.months.forEach((month, mIdx) => {
            const mt = monthTotal(month);
            detailData.push([`Month ${mIdx + 1} - ${month.name}`]);
            detailData.push(['Size', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Count', 'Avg Wt/Pc']);
            
            month.sizes.forEach(size => {
                const st = sizeTotal(size);
                const avgWpc = st.pcs > 0 ? parseFloat((st.wg / st.pcs).toFixed(2)) : 0;
                detailData.push([
                    size.name,
                    st.pcs,
                    st.wg,
                    parseFloat((st.wg / 1000).toFixed(3)),
                    st.cnt,
                    avgWpc
                ]);
            });
            
            const avgWpc = mt.pcs > 0 ? parseFloat((mt.wg / mt.pcs).toFixed(2)) : 0;
            detailData.push(['Month Total', mt.pcs, mt.wg, parseFloat((mt.wg / 1000).toFixed(3)), mt.cnt, avgWpc]);
            detailData.push(['']);
        });
        
        const avgWpc = pt.pcs > 0 ? parseFloat((pt.wg / pt.pcs).toFixed(2)) : 0;
        detailData.push(['GRAND TOTAL', pt.pcs, pt.wg, parseFloat((pt.wg / 1000).toFixed(3)), pt.cnt, avgWpc]);
        
        const sheet = XLSX.utils.aoa_to_sheet(detailData);
        sheet['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
        const sheetName = getValidSheetName(party.name);
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
        
        const fileName = `${party.name}_Detailed_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast('✓ Party report exported to Excel');
    } catch (error) {
        console.error('Export Error:', error);
        toast('Error: ' + error.message);
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
        
        data_arr.push(['ItemTracker - DETAILED ENTRY REPORT']);
        data_arr.push(['']);
        data_arr.push(['Party', party.name, 'Month', month.name, 'Size', size.name]);
        data_arr.push(['Generated', new Date().toLocaleString('en-IN')]);
        data_arr.push(['']);
        data_arr.push(['SUMMARY STATISTICS']);
        data_arr.push(['Metric', 'Value']);
        data_arr.push(['Total Entries', st.cnt]);
        data_arr.push(['Total Pieces', st.pcs]);
        data_arr.push(['Total Weight (g)', st.wg]);
        data_arr.push(['Total Weight (kg)', parseFloat((st.wg / 1000).toFixed(2))]);
        data_arr.push(['Average Pieces/Entry', st.cnt > 0 ? parseFloat((st.pcs / st.cnt).toFixed(2)) : 0]);
        data_arr.push(['Average Weight/Entry (g)', st.cnt > 0 ? parseFloat((st.wg / st.cnt).toFixed(2)) : 0]);
        data_arr.push(['Average Weight/Piece (g)', st.pcs > 0 ? parseFloat((st.wg / st.pcs).toFixed(2)) : 0]);
        data_arr.push(['']);
        data_arr.push(['ENTRY-BY-ENTRY DETAILS']);
        data_arr.push(['#', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Wt/Piece (g)']);
        
        size.entries.forEach((entry, idx) => {
            const wpc = entry.pcs > 0 ? parseFloat((entry.wg / entry.pcs).toFixed(2)) : 0;
            data_arr.push([idx + 1, entry.pcs, entry.wg, parseFloat((entry.wg / 1000).toFixed(3)), wpc]);
        });
        
        data_arr.push(['']);
        const totalWpc = st.pcs > 0 ? parseFloat((st.wg / st.pcs).toFixed(2)) : 0;
        data_arr.push(['TOTAL', st.pcs, st.wg, parseFloat((st.wg / 1000).toFixed(3)), totalWpc]);
        
        const ws = XLSX.utils.aoa_to_sheet(data_arr);
        ws['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        const sheetName = getValidSheetName(size.name);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        const fileName = `${party.name}_${month.name}_${size.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast('✓ Size report exported to Excel');
    } catch (error) {
        console.error('Export Error:', error);
        toast('Error: ' + error.message);
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
        console.log('Starting PDF export for all data...');
        toast('⏳ Generating PDF... Please wait');
        
        let html = `<html>
            <head>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                    .header { background: #5B61FF; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .header h1 { font-size: 28px; margin: 0; }
                    .header p { font-size: 12px; margin-top: 5px; opacity: 0.9; }
                    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                    .card { background: #f0f0f0; padding: 12px; border-radius: 6px; text-align: center; }
                    .card-label { font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; }
                    .card-value { font-size: 24px; font-weight: bold; color: #5B61FF; margin-top: 5px; }
                    h2 { color: #5B61FF; font-size: 16px; margin: 15px 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #e0e0e0; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th { background: #f5f5f5; color: #5B61FF; padding: 8px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; font-size: 11px; }
                    tr:nth-child(even) { background: #fafafa; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>ItemTracker</h1>
                    <p>Complete Data Report - ${new Date().toLocaleDateString('en-IN')}</p>
                </div>
        `;
        
        const totalData = allTotal(data);
        html += `
                <h2>Summary</h2>
                <div class="summary-grid">
                    <div class="card">
                        <div class="card-label">Total Parties</div>
                        <div class="card-value">${totalData.parties}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Total Entries</div>
                        <div class="card-value">${totalData.cnt}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Total Pieces</div>
                        <div class="card-value">${totalData.pcs}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Total Weight</div>
                        <div class="card-value">${(totalData.wg / 1000).toFixed(2)} kg</div>
                    </div>
                </div>
                
                <h2>Party Details</h2>
                <table>
                    <tr>
                        <th>#</th>
                        <th>Party Name</th>
                        <th>Months</th>
                        <th>Entries</th>
                        <th>Pieces</th>
                        <th>Weight (kg)</th>
                    </tr>
        `;
        
        data.parties.forEach((party, idx) => {
            const pt = partyTotal(party);
            html += `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${escHtml(party.name)}</td>
                        <td>${pt.months}</td>
                        <td>${pt.cnt}</td>
                        <td>${pt.pcs}</td>
                        <td>${(pt.wg / 1000).toFixed(2)}</td>
                    </tr>
            `;
        });
        
        html += `</table></body></html>`;
        
        // Generate PDF without creating DOM element
        const filename = `ItemTracker_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        const opt = {
            margin: 8,
            filename: filename,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 1, useCORS: true, allowTaint: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        // Use requestAnimationFrame to prevent UI blocking
        requestAnimationFrame(() => {
            try {
                console.log('Generating PDF with html2pdf...');
                html2pdf()
                    .set(opt)
                    .from(html)
                    .save()
                    .then(() => {
                        console.log('PDF saved');
                        toast('✓ PDF exported');
                    })
                    .catch(err => {
                        console.error('PDF error:', err);
                        toast('Error: ' + (err.message || 'Failed'));
                    });
            } catch (error) {
                console.error('Error:', error);
                toast('Error: ' + error.message);
            }
        });
        
    } catch (error) {
        console.error('PDF Error:', error);
        toast('Error generating PDF');
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
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; padding: 25px; color: #1e293b; }
                    
                    .header { background: linear-gradient(135deg, #5B61FF 0%, #7B7FFF 100%); color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; }
                    .header h1 { font-size: 28px; margin: 0; font-weight: 700; }
                    .header h2 { font-size: 18px; opacity: 0.9; margin-top: 8px; font-weight: 500; }
                    .header .date { font-size: 11px; opacity: 0.8; margin-top: 12px; }
                    
                    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 25px; }
                    .summary-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #5B61FF; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
                    .summary-card .label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; }
                    .summary-card .value { font-size: 20px; font-weight: 700; color: #5B61FF; margin-top: 6px; }
                    
                    h3 { color: #5B61FF; font-size: 14px; margin: 18px 0 10px 0; font-weight: 700; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
                    
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
                    th { background: #f1f5f9; color: #5B61FF; padding: 10px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
                    td { padding: 9px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                    tr:hover { background: #f8fafc; }
                    
                    .month-section { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
                    
                    .total-row { background: #e8eaf6; font-weight: 700; color: #5B61FF; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📦 ItemTracker</h1>
                    <h2>${escHtml(party.name)}</h2>
                    <div class="date">Generated: ${new Date().toLocaleString('en-IN')}</div>
                </div>
                
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="label">Total Months</div>
                        <div class="value">${pt.months}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Entries</div>
                        <div class="value">${pt.cnt}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Pieces</div>
                        <div class="value">${fmtNum(pt.pcs)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Weight</div>
                        <div class="value">${fmtWtKg(pt.wg)}</div>
                    </div>
                </div>
        `;
        
        party.months.forEach((month, mIdx) => {
            const mt = monthTotal(month);
            html += `
                <div class="month-section">
                    <h3>📅 Month ${mIdx + 1}: ${escHtml(month.name)}</h3>
                    <table>
                        <tr><th>Size</th><th style="text-align: center;">Pcs</th><th style="text-align: center;">Weight (g)</th><th style="text-align: center;">Count</th><th style="text-align: right;">Avg Wt/Pc</th></tr>
            `;
            
            month.sizes.forEach(size => {
                const st = sizeTotal(size);
                const wpc = st.pcs > 0 ? (st.wg / st.pcs).toFixed(2) : 0;
                html += `
                        <tr>
                            <td><strong>${escHtml(size.name)}</strong></td>
                            <td style="text-align: center;">${st.pcs}</td>
                            <td style="text-align: center;">${st.wg}</td>
                            <td style="text-align: center;">${st.cnt}</td>
                            <td style="text-align: right; font-weight: 600;">${wpc}g</td>
                        </tr>
                `;
            });
            
            const mtWpc = mt.pcs > 0 ? (mt.wg / mt.pcs).toFixed(2) : 0;
            html += `
                        <tr class="total-row">
                            <td>Month Total</td>
                            <td style="text-align: center;">${mt.pcs}</td>
                            <td style="text-align: center;">${mt.wg}</td>
                            <td style="text-align: center;">${mt.cnt}</td>
                            <td style="text-align: right;">${mtWpc}g</td>
                        </tr>
                    </table>
                </div>
            `;
        });
        
        html += `</body></html>`;
        element.innerHTML = html;
        
        const opt = {
            margin: 10,
            filename: `${party.name}_Detailed_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        setTimeout(() => {
            try {
                const pdf = html2pdf().set(opt).from(element);
                pdf.save().then(() => {
                    toast('✓ Party report exported to PDF');
                }).catch(err => {
                    console.error('PDF save error:', err);
                    toast('Error saving PDF: ' + (err.message || 'Unknown error'));
                });
            } catch (error) {
                console.error('PDF generation error:', error);
                toast('Error generating PDF');
            }
        }, 300);
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
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; padding: 20px; color: #1e293b; }
                    
                    .header { background: linear-gradient(135deg, #5B61FF 0%, #7B7FFF 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .header h1 { font-size: 24px; margin: 0; font-weight: 700; }
                    .header .subtitle { font-size: 12px; opacity: 0.9; margin-top: 6px; }
                    
                    .breadcrumb { font-size: 11px; color: #64748b; margin-bottom: 15px; }
                    
                    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                    .summary-card { background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #5B61FF; box-shadow: 0 2px 4px rgba(0,0,0,0.06); text-align: center; }
                    .summary-card .label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
                    .summary-card .value { font-size: 18px; font-weight: 700; color: #5B61FF; margin-top: 4px; }
                    
                    h2 { color: #5B61FF; font-size: 13px; margin: 15px 0 10px 0; font-weight: 700; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; }
                    
                    table { width: 100%; border-collapse: collapse; margin: 8px 0; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
                    th { background: #f1f5f9; color: #5B61FF; padding: 8px; text-align: center; font-weight: 700; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
                    td { padding: 7px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; }
                    tr:hover { background: #f8fafc; }
                    tr:last-child td { border-bottom: none; }
                    
                    .total-row { background: #e8eaf6; font-weight: 700; color: #5B61FF; }
                    
                    .stat-box { background: #f1f5f9; padding: 8px; border-radius: 6px; margin: 8px 0; font-size: 10px; }
                    .stat-box strong { color: #5B61FF; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📦 ItemTracker</h1>
                    <div class="subtitle">Entry-wise Detailed Report</div>
                </div>
                
                <div class="breadcrumb">
                    <strong>Party:</strong> ${escHtml(party.name)} &nbsp; | &nbsp; 
                    <strong>Month:</strong> ${escHtml(month.name)} &nbsp; | &nbsp; 
                    <strong>Size:</strong> ${escHtml(size.name)}
                </div>
                
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="label">Total Entries</div>
                        <div class="value">${st.cnt}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Pieces</div>
                        <div class="value">${st.pcs}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Weight</div>
                        <div class="value">${fmtWtKg(st.wg)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Avg Wt/Pc</div>
                        <div class="value">${wpc}<span style="font-size: 12px;">g</span></div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                    <div class="stat-box">📊 <strong>Avg Pcs/Entry:</strong> ${avgPcs}</div>
                    <div class="stat-box">⚖️ <strong>Avg Wt/Entry:</strong> ${avgWt}g</div>
                </div>
                
                <h2>📋 Entry-by-Entry Details</h2>
                <table>
                    <tr><th>#</th><th>Pieces</th><th>Weight (g)</th><th>Weight (kg)</th><th>Wt/Piece</th></tr>
        `;
        
        size.entries.forEach((entry, idx) => {
            const wpc_entry = entry.pcs > 0 ? (entry.wg / entry.pcs).toFixed(2) : 0;
            html += `
                    <tr>
                        <td style="font-weight: 700; color: #5B61FF;">${idx + 1}</td>
                        <td>${entry.pcs}</td>
                        <td>${entry.wg}</td>
                        <td>${(entry.wg / 1000).toFixed(3)}</td>
                        <td style="font-weight: 600;">${wpc_entry}g</td>
                    </tr>
            `;
        });
        
        html += `
                    <tr class="total-row">
                        <td>TOTAL</td>
                        <td>${st.pcs}</td>
                        <td>${st.wg}</td>
                        <td>${(st.wg / 1000).toFixed(3)}</td>
                        <td>${wpc}g</td>
                    </tr>
                </table>
                
                <div style="margin-top: 15px; padding: 10px; background: #f1f5f9; border-radius: 6px; font-size: 10px; color: #64748b; border-left: 4px solid #10B981;">
                    Generated: ${new Date().toLocaleString('en-IN')} | Report Version 3.0
                </div>
            </body>
            </html>
        `;
        
        element.innerHTML = html;
        
        const opt = {
            margin: 8,
            filename: `${size.name}_detailed_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        setTimeout(() => {
            try {
                const pdf = html2pdf().set(opt).from(element);
                pdf.save().then(() => {
                    toast('✓ Size report exported to PDF');
                }).catch(err => {
                    console.error('PDF save error:', err);
                    toast('Error saving PDF: ' + (err.message || 'Unknown error'));
                });
            } catch (error) {
                console.error('PDF generation error:', error);
                toast('Error generating PDF');
            }
        }, 300);
    } catch (error) {
        console.error('PDF Error:', error);
        toast('Error: ' + error.message);
    }
}
