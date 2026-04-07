// =============================================
// CUSTOMIZATION MODULE
// - Field name customization
// - Chart visualization
// - Branding settings
// =============================================

// Default field names
const DEFAULT_FIELDS = {
    party: 'Party',
    month: 'Month',
    size: 'Size',
    quantity: 'Pieces',
    weight: 'Grams'
};

// Load custom field names
function getCustomFields() {
    try {
        const saved = localStorage.getItem('itemtracker_custom_fields');
        return saved ? JSON.parse(saved) : { ...DEFAULT_FIELDS };
    } catch (err) {
        console.warn('Failed to load custom fields:', err);
        return { ...DEFAULT_FIELDS };
    }
}

// Save custom field names
function saveCustomFields() {
    try {
        const fields = {
            party: document.getElementById('field-party').value.trim() || DEFAULT_FIELDS.party,
            month: document.getElementById('field-month').value.trim() || DEFAULT_FIELDS.month,
            size: document.getElementById('field-size').value.trim() || DEFAULT_FIELDS.size,
            quantity: document.getElementById('field-quantity').value.trim() || DEFAULT_FIELDS.quantity,
            weight: document.getElementById('field-weight').value.trim() || DEFAULT_FIELDS.weight
        };
        
        localStorage.setItem('itemtracker_custom_fields', JSON.stringify(fields));
        toast('✓ Field names saved successfully');
        closeModal('m-customize');
        
        // Reload UI
        setTimeout(() => {
            location.reload();
        }, 500);
    } catch (err) {
        console.error('Error saving fields:', err);
        toast('Error saving fields');
    }
}

// Initialize custom fields modal
function initCustomizationModal() {
    const fields = getCustomFields();
    document.getElementById('field-party').value = fields.party;
    document.getElementById('field-month').value = fields.month;
    document.getElementById('field-size').value = fields.size;
    document.getElementById('field-quantity').value = fields.quantity;
    document.getElementById('field-weight').value = fields.weight;
}

// ===== CHART VISUALIZATION =====

let partyChart = null;
let trendChart = null;

function initCharts() {
    if (!data || !data.parties) return;
    
    const fields = getCustomFields();
    
    // Build party inventory data
    const partyNames = data.parties.map(p => p.name).slice(0, 10); // Limit to 10 for readability
    const partyQuantities = data.parties.map(p => partyTotal(p).pcs).slice(0, 10);
    const partyWeights = data.parties.map(p => (partyTotal(p).wg / 1000).toFixed(2)).slice(0, 10);
    
    // Destroy existing charts if they exist
    if (partyChart) partyChart.destroy();
    if (trendChart) trendChart.destroy();
    
    // Chart 1: Party Inventory (Bar Chart)
    const partyCtx = document.getElementById('partyChart');
    if (partyCtx) {
        partyChart = new Chart(partyCtx, {
            type: 'bar',
            data: {
                labels: partyNames,
                datasets: [
                    {
                        label: `Total ${fields.quantity}`,
                        data: partyQuantities,
                        backgroundColor: 'rgba(91, 97, 255, 0.7)',
                        borderColor: '#5B61FF',
                        borderWidth: 1
                    },
                    {
                        label: `Total ${fields.weight} (kg)`,
                        data: partyWeights,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: '#10B981',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            font: { size: 11 },
                            padding: 10
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: { size: 10 }
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }
    
    // Chart 2: Cumulative Trend (Line Chart)
    let cumulativeQty = 0;
    let cumulativeWt = 0;
    const trendLabels = [];
    const trendQtyData = [];
    const trendWtData = [];
    
    if (data.parties.length > 0) {
        data.parties.forEach(party => {
            trendLabels.push(party.name.substring(0, 8)); // Truncate for readability
            cumulativeQty += partyTotal(party).pcs;
            cumulativeWt += partyTotal(party).wg / 1000;
            trendQtyData.push(cumulativeQty);
            trendWtData.push(parseFloat(cumulativeWt.toFixed(2)));
        });
    }
    
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [
                    {
                        label: `Cumulative ${fields.quantity}`,
                        data: trendQtyData,
                        borderColor: '#5B61FF',
                        backgroundColor: 'rgba(91, 97, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: `Cumulative ${fields.weight} (kg)`,
                        data: trendWtData,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        labels: {
                            font: { size: 11 },
                            padding: 10
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            font: { size: 10 }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            font: { size: 10 }
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }
}

// Open charts modal
function openChartsModal() {
    openModal('m-charts');
    // Initialize charts after modal is visible
    setTimeout(() => {
        initCharts();
    }, 100);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initCustomizationModal();
});
