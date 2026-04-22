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

// ===== STYLING HELPERS FOR EXCELJS =====
const BRAND_COLOR = '4A50E2';
const BRAND_DARK = '3539A6';
const LIGHT_BLUE = 'E8EBF7';
const LIGHT_BLUE_ALT = 'F4F5FC';
const BORDER_COLOR = 'D0D5DD';
const BORDER_DARK = '98A2B3';
const TOTAL_BG = 'FFF4E5';
const TOTAL_BORDER = 'F79009';
const TOTAL_TEXT = 'B54708';
const TEXT_PRIMARY = '1D2939';
const TEXT_SECONDARY = '475467';
const MONTH_BG = 'EEF4FF';
const MONTH_TEXT = '3538CD';
const WHITE_COLOR = 'FFFFFF';

function getHeaderFill() {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLOR } };
}

function getHeaderFont() {
    return { bold: true, color: { argb: 'FF' + WHITE_COLOR }, size: 11, name: 'Calibri' };
}

function getTitleFill() {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_DARK } };
}

function getTitleFont() {
    return { bold: true, color: { argb: 'FF' + WHITE_COLOR }, size: 16, name: 'Calibri' };
}

function getSubheaderFill() {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb: MONTH_BG } };
}

function getSubheaderFont() {
    return { bold: true, color: { argb: 'FF' + MONTH_TEXT }, size: 11, name: 'Calibri' };
}

function getAlternateRowFill() {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE_ALT } };
}

function getNumberFont() {
    return { bold: true, color: { argb: 'FF' + BRAND_COLOR }, size: 10, name: 'Calibri' };
}

function getNormalFont() {
    return { size: 10, color: { argb: 'FF' + TEXT_PRIMARY }, name: 'Calibri' };
}

function getTotalFill() {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
}

function getTotalFont() {
    return { bold: true, color: { argb: 'FF' + TOTAL_TEXT }, size: 11, name: 'Calibri' };
}

function getBorder() {
    return {
        left: { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } },
        right: { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } },
        top: { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } }
    };
}

function getHeaderBorder() {
    return {
        left: { style: 'thin', color: { argb: 'FF' + BRAND_DARK } },
        right: { style: 'thin', color: { argb: 'FF' + BRAND_DARK } },
        top: { style: 'medium', color: { argb: 'FF' + BRAND_DARK } },
        bottom: { style: 'medium', color: { argb: 'FF' + BRAND_DARK } }
    };
}

function getTotalBorder() {
    return {
        left: { style: 'thin', color: { argb: 'FF' + TOTAL_BORDER } },
        right: { style: 'thin', color: { argb: 'FF' + TOTAL_BORDER } },
        top: { style: 'double', color: { argb: 'FF' + TOTAL_BORDER } },
        bottom: { style: 'medium', color: { argb: 'FF' + TOTAL_BORDER } }
    };
}

function getCellAlignment() {
    return { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function getLeftAlignment() {
    return { horizontal: 'left', vertical: 'middle', wrapText: true };
}

function applyTitleRow(sheet, row, colCount) {
    row.font = getTitleFont();
    row.fill = getTitleFill();
    row.alignment = getLeftAlignment();
    row.height = 36;
    if (colCount > 1) {
        sheet.mergeCells(row.number, 1, row.number, colCount);
    }
}

function applyHeaderRow(row) {
    row.font = getHeaderFont();
    row.fill = getHeaderFill();
    row.alignment = getCellAlignment();
    row.height = 28;
    row.eachCell(cell => { 
        cell.border = getHeaderBorder();
    });
}

function applySubheaderRow(row, sheet, colCount) {
    row.font = getSubheaderFont();
    row.fill = getSubheaderFill();
    row.alignment = getLeftAlignment();
    row.height = 24;
    if (sheet && colCount > 1) {
        sheet.mergeCells(row.number, 1, row.number, colCount);
    }
    row.eachCell(cell => {
        cell.border = {
            bottom: { style: 'thin', color: { argb: 'FF' + MONTH_TEXT } }
        };
    });
}

function applyDataRow(row, isAlternate = false) {
    if (isAlternate) {
        row.fill = getAlternateRowFill();
    }
    row.alignment = getCellAlignment();
    row.height = 22;
    row.eachCell(cell => { 
        cell.border = getBorder();
        if (cell.value !== null && cell.value !== undefined && typeof cell.value === 'number') {
            cell.font = getNumberFont();
            cell.numFmt = cell.value % 1 !== 0 ? '#,##0.00' : '#,##0';
        } else {
            cell.font = getNormalFont();
        }
    });
}

function applyTotalRow(row) {
    row.font = getTotalFont();
    row.fill = getTotalFill();
    row.alignment = getCellAlignment();
    row.height = 28;
    row.eachCell(cell => {
        cell.border = getTotalBorder();
        if (cell.value !== null && cell.value !== undefined && typeof cell.value === 'number') {
            cell.numFmt = cell.value % 1 !== 0 ? '#,##0.00' : '#,##0';
        }
    });
}

function applyInfoRow(row) {
    row.font = { size: 10, color: { argb: 'FF' + TEXT_SECONDARY }, name: 'Calibri', italic: true };
    row.alignment = getLeftAlignment();
    row.height = 18;
}

function applyPrintSetup(sheet) {
    sheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
    };
    sheet.headerFooter = {
        oddFooter: '&L&8Ravi Singam Report&C&8Page &P of &N&R&8&D'
    };
}

// ===== EXPORT DATE PROMPT HELPERS =====
let pendingExportType = null; // 'party' or 'size'

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtClosingDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Called when "Export All" modal opens (set default date)
const origOpenExportModal = window.openModal;
// We patch the openModal call for m-export to set default date
(function() {
    const origOpen = window.openModal || function(){};
    window.openModal = function(id) {
        if (id === 'm-export') {
            document.getElementById('iexp-close-date').value = getTodayStr();
        }
        origOpen(id);
    };
})();

// Export loading overlay helpers
function showExportLoading(msg) {
    const el = document.getElementById('export-overlay');
    if (el) {
        el.querySelector('.export-overlay-text').textContent = msg || 'Generating report...';
        el.classList.remove('hidden');
    }
}
function hideExportLoading() {
    const el = document.getElementById('export-overlay');
    if (el) el.classList.add('hidden');
}

function doExportAll(format) {
    const closeDate = document.getElementById('iexp-close-date').value;
    if (!closeDate) { toast('Please select a delivery date'); return; }
    closeModal('m-export');
    if (format === 'excel') exportAllDataExcel(closeDate);
    else exportAllDataPDF(closeDate);
}

function openExportDateModal(type) {
    pendingExportType = type;
    const titles = { party: '📊 Export Party Report', size: '📊 Export Size Report' };
    document.getElementById('m-export-date-title').textContent = titles[type] || '📊 Export Report';
    document.getElementById('iexp-close-date2').value = getTodayStr();
    openModal('m-export-date');
}

function doExportWithDate(format) {
    const closeDate = document.getElementById('iexp-close-date2').value;
    if (!closeDate) { toast('Please select a delivery date'); return; }
    closeModal('m-export-date');
    if (pendingExportType === 'party') {
        if (format === 'excel') exportPartyExcel(closeDate);
        else exportPartyPDF(closeDate);
    } else if (pendingExportType === 'size') {
        if (format === 'excel') exportSizeExcel(closeDate);
        else exportSizePDF(closeDate);
    }
}

// ===== EXPORT ALL DATA TO EXCEL (USING EXCELJS) =====
function exportAllDataExcel(closingDate) {
    if (!data || data.parties.length === 0) {
        toast('No data to export');
        return;
    }

    try {
        showExportLoading('Generating Excel report...');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Ravi Singam';
        workbook.created = new Date();
        
        // Create summary sheet
        const summarySheet = workbook.addWorksheet('Summary', { properties: { tabColor: { argb: BRAND_COLOR } } });
        
        // Title row - merged across all columns
        let row = summarySheet.addRow(['Ravi Singam - COMPLETE INVENTORY REPORT']);
        applyTitleRow(summarySheet, row, 7);
        
        row = summarySheet.addRow(['Generated: ' + new Date().toLocaleString('en-IN') + '  |  Delivery Date: ' + fmtClosingDate(closingDate)]);
        applyInfoRow(row);
        summarySheet.mergeCells(row.number, 1, row.number, 7);
        
        summarySheet.addRow([]);
        
        // Executive Summary
        row = summarySheet.addRow(['EXECUTIVE SUMMARY']);
        applySubheaderRow(row, summarySheet, 7);
        
        summarySheet.addRow([]);
        
        let totalPcs = 0, totalWt = 0;
        data.parties.forEach(p => {
            const t = partyTotal(p);
            totalPcs += t.pcs;
            totalWt += t.wg;
        });
        
        // Summary as a nice horizontal card layout
        row = summarySheet.addRow(['Total Parties', 'Total Pieces', 'Total Weight (kg)', 'Avg Weight/Piece (g)']);
        row.font = { size: 9, color: { argb: 'FF' + TEXT_SECONDARY }, name: 'Calibri', bold: true };
        row.alignment = getCellAlignment();
        row.height = 20;
        row.eachCell(cell => { cell.border = getBorder(); cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } }; });
        
        row = summarySheet.addRow([data.parties.length, totalPcs, parseFloat((totalWt / 1000).toFixed(2)), totalPcs > 0 ? parseFloat((totalWt / totalPcs).toFixed(2)) : 0]);
        row.font = { bold: true, size: 18, color: { argb: 'FF' + BRAND_COLOR }, name: 'Calibri' };
        row.alignment = getCellAlignment();
        row.height = 32;
        row.eachCell(cell => { cell.border = getBorder(); cell.numFmt = '#,##0.00'; });
        
        summarySheet.addRow([]);
        summarySheet.addRow([]);
        
        // Party-wise breakdown header
        row = summarySheet.addRow(['PARTY-WISE BREAKDOWN']);
        applySubheaderRow(row, summarySheet, 7);
        
        row = summarySheet.addRow(['#', 'Party Name', 'Months', 'Entries', 'Total Pieces', 'Total Weight (kg)', 'Avg Wt/Pc (g)']);
        applyHeaderRow(row);
        
        data.parties.forEach((p, idx) => {
            const t = partyTotal(p);
            const avgWpc = t.pcs > 0 ? parseFloat((t.wg / t.pcs).toFixed(2)) : 0;
            row = summarySheet.addRow([idx + 1, p.name, t.months, t.cnt, t.pcs, parseFloat((t.wg / 1000).toFixed(2)), avgWpc]);
            applyDataRow(row, idx % 2 === 0);
        });
        
        // Grand total row
        row = summarySheet.addRow(['', 'GRAND TOTAL', '', data.parties.reduce((s, p) => s + partyTotal(p).cnt, 0), totalPcs, parseFloat((totalWt / 1000).toFixed(2)), totalPcs > 0 ? parseFloat((totalWt / totalPcs).toFixed(2)) : 0]);
        applyTotalRow(row);
        
        summarySheet.columns = [
            { width: 6 }, { width: 24 }, { width: 12 }, { width: 12 }, { width: 16 }, { width: 18 }, { width: 16 }
        ];
        
        summarySheet.views = [{ state: 'frozen', ySplit: 1 }];
        applyPrintSetup(summarySheet);
        
        // Create detailed sheets for each party
        const usedNames = new Set(['Summary']);
        data.parties.forEach((party, pIdx) => {
            const sheetName = getUniqueSheetName(party.name, usedNames, pIdx + 1);
            const sheet = workbook.addWorksheet(sheetName, { properties: { tabColor: { argb: BRAND_COLOR } } });
            const pt = partyTotal(party);
            
            // Title
            row = sheet.addRow([`${party.name} - DETAILED REPORT`]);
            applyTitleRow(sheet, row, 7);
            
            row = sheet.addRow(['Generated: ' + new Date().toLocaleString('en-IN') + '  |  Delivery Date: ' + fmtClosingDate(closingDate)]);
            applyInfoRow(row);
            sheet.mergeCells(row.number, 1, row.number, 7);
            
            sheet.addRow([]);
            
            // Party summary
            row = sheet.addRow(['Party Summary']);
            applySubheaderRow(row, sheet, 7);
            
            let summaryRows = [
                ['Total Months', pt.months, 'Total Entries', pt.cnt, 'Total Pieces', pt.pcs],
                ['Total Weight (kg)', parseFloat((pt.wg / 1000).toFixed(2)), 'Avg Wt/Pc (g)', pt.pcs > 0 ? parseFloat((pt.wg / pt.pcs).toFixed(2)) : 0]
            ];
            
            summaryRows.forEach((d, idx) => {
                row = sheet.addRow(d);
                applyDataRow(row, idx % 2 === 0);
            });
            
            sheet.addRow([]);
            
            // Month-wise details
            party.months.forEach((month, mIdx) => {
                const mt = monthTotal(month);
                
                const monthDateStr = month.date ? '  (' + fmtClosingDate(month.date) + ')' : '';
                row = sheet.addRow([`📅 Month ${mIdx + 1} - ${month.name}${monthDateStr}`]);
                applySubheaderRow(row, sheet, 7);
                
                row = sheet.addRow(['Size', 'Expected/Pc', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Count', 'Avg Wt/Pc']);
                applyHeaderRow(row);
                
                month.sizes.forEach((size, sIdx) => {
                    const st = sizeTotal(size);
                    const wpc = st.pcs > 0 ? parseFloat((st.wg / st.pcs).toFixed(2)) : 0;
                    row = sheet.addRow([size.name, size.expectedGrams || 0, st.pcs, st.wg, parseFloat((st.wg / 1000).toFixed(3)), st.cnt, wpc]);
                    applyDataRow(row, sIdx % 2 === 0);
                });
                
                const mtAvg = mt.pcs > 0 ? parseFloat((mt.wg / mt.pcs).toFixed(2)) : 0;
                row = sheet.addRow(['MONTH TOTAL', '', mt.pcs, mt.wg, parseFloat((mt.wg / 1000).toFixed(3)), mt.cnt, mtAvg]);
                applyTotalRow(row);
                sheet.addRow([]);
            });
            
            // Party total
            const ptAvg = pt.pcs > 0 ? parseFloat((pt.wg / pt.pcs).toFixed(2)) : 0;
            row = sheet.addRow(['PARTY TOTAL', '', pt.pcs, pt.wg, parseFloat((pt.wg / 1000).toFixed(3)), pt.cnt, ptAvg]);
            applyTotalRow(row);
            
            sheet.columns = [{ width: 24 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 16 }];
            sheet.views = [{ state: 'frozen', ySplit: 1 }];
            applyPrintSetup(sheet);
        });
        
        const fileName = `TowelTracker_${new Date().toISOString().split('T')[0]}.xlsx`;
        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, fileName);
            hideExportLoading();
            toast('u{2713} Excel exported successfully');
        }).catch(err => { hideExportLoading(); toast('Error: ' + err.message); });
    } catch (error) {
        hideExportLoading();
        console.error('Export Excel Error:', error);
        toast('Error: ' + error.message);
    }
}

// ===== EXPORT SINGLE PARTY TO EXCEL =====
function exportPartyExcel(closingDate) {
    const party = getParty();
    if (!party) {
        toast('Select a party first');
        return;
    }

    try {
        showExportLoading('Generating party report...');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Ravi Singam';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Party Details', { properties: { tabColor: { argb: BRAND_COLOR } } });
        const pt = partyTotal(party);
        
        // Title
        let row = sheet.addRow([`${party.name} - DETAILED REPORT`]);
        applyTitleRow(sheet, row, 7);
        
        row = sheet.addRow(['Generated: ' + new Date().toLocaleString('en-IN') + '  |  Delivery Date: ' + fmtClosingDate(closingDate)]);
        applyInfoRow(row);
        sheet.mergeCells(row.number, 1, row.number, 7);
        
        sheet.addRow([]);
        
        // Party summary - horizontal card style
        row = sheet.addRow(['Party Summary']);
        applySubheaderRow(row, sheet, 7);
        
        row = sheet.addRow(['Total Months', 'Total Entries', 'Total Pieces', 'Total Weight (kg)', 'Avg Wt/Pc (g)']);
        row.font = { size: 9, color: { argb: 'FF' + TEXT_SECONDARY }, name: 'Calibri', bold: true };
        row.alignment = getCellAlignment();
        row.height = 20;
        row.eachCell(cell => { cell.border = getBorder(); cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } }; });
        
        row = sheet.addRow([pt.months, pt.cnt, pt.pcs, parseFloat((pt.wg / 1000).toFixed(2)), pt.pcs > 0 ? parseFloat((pt.wg / pt.pcs).toFixed(2)) : 0]);
        row.font = { bold: true, size: 16, color: { argb: 'FF' + BRAND_COLOR }, name: 'Calibri' };
        row.alignment = getCellAlignment();
        row.height = 30;
        row.eachCell(cell => { cell.border = getBorder(); if (typeof cell.value === 'number') cell.numFmt = '#,##0.00'; });
        
        sheet.addRow([]);
        
        // Month-wise details
        party.months.forEach((month, mIdx) => {
            const mt = monthTotal(month);
            
            const monthDateStr2 = month.date ? '  (' + fmtClosingDate(month.date) + ')' : '';
            row = sheet.addRow([`📅 Month ${mIdx + 1} - ${month.name}${monthDateStr2}`]);
            applySubheaderRow(row, sheet, 7);
            
            row = sheet.addRow(['Size', 'Expected/Pc', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Count', 'Avg Wt/Pc']);
            applyHeaderRow(row);
            
            month.sizes.forEach((size, sIdx) => {
                const st = sizeTotal(size);
                const avgWpc = st.pcs > 0 ? parseFloat((st.wg / st.pcs).toFixed(2)) : 0;
                row = sheet.addRow([size.name, size.expectedGrams || 0, st.pcs, st.wg, parseFloat((st.wg / 1000).toFixed(3)), st.cnt, avgWpc]);
                applyDataRow(row, sIdx % 2 === 0);
            });
            
            const avgWpc = mt.pcs > 0 ? parseFloat((mt.wg / mt.pcs).toFixed(2)) : 0;
            row = sheet.addRow(['MONTH TOTAL', '', mt.pcs, mt.wg, parseFloat((mt.wg / 1000).toFixed(3)), mt.cnt, avgWpc]);
            applyTotalRow(row);
            
            sheet.addRow([]);
        });
        
        // Party total
        const avgWpc2 = pt.pcs > 0 ? parseFloat((pt.wg / pt.pcs).toFixed(2)) : 0;
        row = sheet.addRow(['PARTY TOTAL', '', pt.pcs, pt.wg, parseFloat((pt.wg / 1000).toFixed(3)), pt.cnt, avgWpc2]);
        applyTotalRow(row);
        
        sheet.columns = [{ width: 24 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 16 }];
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        applyPrintSetup(sheet);
        
        const fileName = `${party.name}_Detailed_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, fileName);
            hideExportLoading();
            toast('u{2713} Party report exported to Excel');
        }).catch(err => { hideExportLoading(); toast('Error: ' + err.message); });
    } catch (error) {
        hideExportLoading();
        console.error('Export Error:', error);
        toast('Error: ' + error.message);
    }
}

// ===== EXPORT SIZE DATA TO EXCEL =====
function exportSizeExcel(closingDate) {
    const party = getParty();
    const month = getMonth();
    const size = getSize();
    
    if (!party || !month || !size) {
        toast('Navigate to size/entries first');
        return;
    }

    try {
        showExportLoading('Generating size report...');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Ravi Singam';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Size Details', { properties: { tabColor: { argb: BRAND_COLOR } } });
        const st = sizeTotal(size);
        
        // Title
        let row = sheet.addRow([`${size.name} - SIZE DETAILS`]);
        applyTitleRow(sheet, row, 5);
        
        const monthDateDisp = month.date ? ' (' + fmtClosingDate(month.date) + ')' : '';
        row = sheet.addRow(['Party: ' + party.name + '  |  Month: ' + month.name + monthDateDisp + '  |  Delivery Date: ' + fmtClosingDate(closingDate) + '  |  Size: ' + size.name]);
        applyInfoRow(row);
        sheet.mergeCells(row.number, 1, row.number, 5);
        
        sheet.addRow([]);
        
        // Summary statistics - horizontal card style
        row = sheet.addRow(['SUMMARY']);
        applySubheaderRow(row, sheet, 5);
        
        row = sheet.addRow(['Expected/Pc (g)', 'Total Entries', 'Total Pieces', 'Total Weight (kg)', 'Avg Wt/Pc (g)']);
        row.font = { size: 9, color: { argb: 'FF' + TEXT_SECONDARY }, name: 'Calibri', bold: true };
        row.alignment = getCellAlignment();
        row.height = 20;
        row.eachCell(cell => { cell.border = getBorder(); cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } }; });
        
        const avgWpc = st.pcs > 0 ? parseFloat((st.wg / st.pcs).toFixed(2)) : 0;
        const expectedG = size.expectedGrams || 0;
        
        row = sheet.addRow([expectedG, st.cnt, st.pcs, parseFloat((st.wg / 1000).toFixed(2)), avgWpc]);
        row.font = { bold: true, size: 16, color: { argb: 'FF' + BRAND_COLOR }, name: 'Calibri' };
        row.alignment = getCellAlignment();
        row.height = 30;
        row.eachCell((cell) => {
            cell.border = getBorder();
            if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
        });
        
        sheet.addRow([]);
        
        // Entry details
        row = sheet.addRow(['ENTRY-BY-ENTRY DETAILS']);
        applySubheaderRow(row, sheet, 5);
        
        row = sheet.addRow(['#', 'Pieces', 'Weight (g)', 'Weight (kg)', 'Wt/Piece (g)']);
        applyHeaderRow(row);
        
        size.entries.forEach((entry, idx) => {
            const wpc = entry.pcs > 0 ? parseFloat((entry.wg / entry.pcs).toFixed(2)) : 0;
            row = sheet.addRow([idx + 1, entry.pcs, entry.wg, parseFloat((entry.wg / 1000).toFixed(3)), wpc]);
            applyDataRow(row, idx % 2 === 0);
        });
        
        sheet.addRow([]);
        
        // Total row
        const totalWpc = st.pcs > 0 ? parseFloat((st.wg / st.pcs).toFixed(2)) : 0;
        row = sheet.addRow(['TOTAL', st.pcs, st.wg, parseFloat((st.wg / 1000).toFixed(3)), totalWpc]);
        applyTotalRow(row);
        
        sheet.columns = [{ width: 10 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 16 }];
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        applyPrintSetup(sheet);
        
        const fileName = `${party.name}_${month.name}_${size.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, fileName);
            hideExportLoading();
            toast('u{2713} Size report exported to Excel');
        }).catch(err => { hideExportLoading(); toast('Error: ' + err.message); });
    } catch (error) {
        hideExportLoading();
        console.error('Export Error:', error);
        toast('Error: ' + error.message);
    }
}

// ===== EXPORT ALL DATA TO PDF =====
function exportAllDataPDF(closingDate) {
    if (!data || data.parties.length === 0) {
        toast('No data to export');
        return;
    }

    try {
        console.log('Starting PDF export for all data...');
        showExportLoading('Generating PDF report...');
        
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
                    <h1>Ravi Singam</h1>
                    <p>Complete Data Report - ${new Date().toLocaleDateString('en-IN')}  |  Delivery Date: ${fmtClosingDate(closingDate)}</p>
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
        const filename = `RaviSingam_Report_${new Date().toISOString().split('T')[0]}.pdf`;
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
                        hideExportLoading();
                        toast('u{2713} PDF exported');
                    })
                    .catch(err => {
                        console.error('PDF error:', err);
                        hideExportLoading();
                        toast('Error: ' + (err.message || 'Failed'));
                    });
            } catch (error) {
                console.error('Error:', error);
                hideExportLoading();
                toast('Error: ' + error.message);
            }
        });
        
    } catch (error) {
        hideExportLoading();
        console.error('PDF Error:', error);
        toast('Error generating PDF');
    }
}

// ===== EXPORT PARTY TO PDF =====
function exportPartyPDF(closingDate) {
    const party = getParty();
    if (!party) {
        toast('Select a party first');
        return;
    }

    try {
        showExportLoading('Generating party PDF...');
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
                    <h1>📦 Ravi Singam</h1>
                    <h2>${escHtml(party.name)}</h2>
                    <div class="date">Generated: ${new Date().toLocaleString('en-IN')}  |  Delivery Date: ${fmtClosingDate(closingDate)}</div>
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
                    <h3>📅 Month ${mIdx + 1}: ${escHtml(month.name)}${month.date ? ' (' + fmtClosingDate(month.date) + ')' : ''}</h3>
                    <table>
                        <tr><th>Size</th><th style="text-align: center;">Expected/Pc</th><th style="text-align: center;">Pcs</th><th style="text-align: center;">Weight (g)</th><th style="text-align: center;">Count</th><th style="text-align: right;">Avg Wt/Pc</th></tr>
            `;
            
            month.sizes.forEach(size => {
                const st = sizeTotal(size);
                const wpc = st.pcs > 0 ? (st.wg / st.pcs).toFixed(2) : 0;
                html += `
                        <tr>
                            <td><strong>${escHtml(size.name)}</strong></td>
                            <td style="text-align: center;">${size.expectedGrams || '-'}</td>
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
                            <td style="text-align: center;">-</td>
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
                    hideExportLoading();
                    toast('u{2713} Party report exported to PDF');
                }).catch(err => {
                    hideExportLoading();
                    console.error('PDF save error:', err);
                    toast('Error saving PDF: ' + (err.message || 'Unknown error'));
                });
            } catch (error) {
                hideExportLoading();
                console.error('PDF generation error:', error);
                toast('Error generating PDF');
            }
        }, 300);
    } catch (error) {
        hideExportLoading();
        console.error('PDF Error:', error);
        toast('Error: ' + error.message);
    }
}

// ===== EXPORT SIZE DATA TO PDF =====
function exportSizePDF(closingDate) {
    const party = getParty();
    const month = getMonth();
    const size = getSize();
    
    if (!party || !month || !size) {
        toast('Navigate to size/entries first');
        return;
    }

    try {
        showExportLoading('Generating size PDF...');
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
                    
                    .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
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
                    <h1>📦 Ravi Singam</h1>
                    <div class="subtitle">Entry-wise Detailed Report</div>
                </div>
                
                <div class="breadcrumb">
                    <strong>Party:</strong> ${escHtml(party.name)} &nbsp; | &nbsp; 
                    <strong>Month:</strong> ${escHtml(month.name)}${month.date ? ' (' + fmtClosingDate(month.date) + ')' : ''} &nbsp; | &nbsp; 
                    <strong>Delivery Date:</strong> ${fmtClosingDate(closingDate)} &nbsp; | &nbsp; 
                    <strong>Size:</strong> ${escHtml(size.name)}
                </div>
                
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="label">Expected/Pc</div>
                        <div class="value">${size.expectedGrams || '-'}<span style="font-size: 12px;">g</span></div>
                    </div>
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
                    <div class="stat-box">⚖️ <strong>Avg Wt/Entry:</strong> ${avgWt}g</div>
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
                    hideExportLoading();
                    toast('u{2713} Size report exported to PDF');
                }).catch(err => {
                    hideExportLoading();
                    console.error('PDF save error:', err);
                    toast('Error saving PDF: ' + (err.message || 'Unknown error'));
                });
            } catch (error) {
                hideExportLoading();
                console.error('PDF generation error:', error);
                toast('Error generating PDF');
            }
        }, 300);
    } catch (error) {
        hideExportLoading();
        console.error('PDF Error:', error);
        toast('Error: ' + error.message);
    }
}
