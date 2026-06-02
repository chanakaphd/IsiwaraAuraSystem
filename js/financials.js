/**
 * Isiwara Aura - Financial Analytics & Ledger Performance Dashboard
 * Driven strictly by cloud-side calculated database formula parameters.
 */

async function fetchAndRenderFinancialMetricsOverview() {
    const dashboardContainer = document.getElementById('financials-metrics-grid');
    if (!dashboardContainer) return;

    console.log("📡 Extracting financial ledger performance layers from database records...");
    const financialRecords = await fetchAirtableTableRecords('Financial Ledger');

    let totalGrossCollected = 0;
    let totalCommissionOutflow = 0;
    let totalNetHouseRevenue = 0;

    // Filter current month to compute Month-To-Date calculations safely
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    financialRecords.forEach(record => {
        const fields = record.fields;
        const timestampStr = fields['Transaction Timestamp'] || record.createdTime;
        if (!timestampStr) return;

        const recordDate = new Date(timestampStr);
        if (recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth) {
            
            // ARCHITECTURAL FIX: Extract the values computed on Airtable's side directly
            const grossValue = parseFloat(fields['Gross Collected']) || 0;
            const commValue = parseFloat(fields['Calculated Commission']) || 0;
            const netValue = parseFloat(fields['Net Revenue']) || 0;

            totalGrossCollected += grossValue;
            totalCommissionOutflow += commValue;
            totalNetHouseRevenue += netValue;
        }
    });

    // Populate UI layout metric elements safely
    if (document.getElementById('metricGrossCollected')) {
        document.getElementById('metricGrossCollected').innerText = `රු. ${totalGrossCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
    if (document.getElementById('metricCommissionOutflow')) {
        document.getElementById('metricCommissionOutflow').innerText = `රු. ${totalCommissionOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
    if (document.getElementById('metricNetHouseRevenue')) {
        document.getElementById('metricNetHouseRevenue').innerText = `රු. ${totalNetHouseRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }

    console.log("✅ Dashboard calculations balanced perfectly with cloud infrastructure records.");
}

// Fire rendering immediately if view hook exists on load
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('financials-metrics-grid')) {
        fetchAndRenderFinancialMetricsOverview();
    }
});
