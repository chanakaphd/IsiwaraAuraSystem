/**
 * Isiwara Aura - Financial Analytics & Dashboard Parser
 */

async function fetchAndRenderFinancialMetricsOverview() {
    const tableBody = document.getElementById('financials-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-3">Fetching fresh financial records from cloud sync...</td></tr>`;

    const financialRecords = await fetchAirtableTableRecords('Financial Ledger');

    let totalGrossCollected = 0;
    let totalCommissionOutflow = 0;
    let totalNetHouseRevenue = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    if (financialRecords.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-3">No accounting audit trails logged.</td></tr>`;
        return;
    }

    tableBody.innerHTML = financialRecords.map(record => {
        const fields = record.fields;
        const timestampStr = fields['Transaction Timestamp'] || record.createdTime;
        const recordDate = new Date(timestampStr);

        // Map rollup values from Airtable formulas
        const grossValue = parseFloat(fields['Gross Collected']) || 0;
        const commValue = parseFloat(fields['Calculated Commission']) || 0;
        const netValue = parseFloat(fields['Net Revenue']) || 0;

        if (recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth) {
            totalGrossCollected += grossValue;
            totalCommissionOutflow += commValue;
            totalNetHouseRevenue += netValue;
        }

        return `
            <tr>
                <td><strong class="font-monospace">${record.id.slice(-6).toUpperCase()}</strong></td>
                <td>👤 ${fields['Guest Name Lookup'] || 'Walk-In Guest'}</td>
                <td>රු. ${(parseFloat(fields['Base Revenue']) || 0).toFixed(2)}</td>
                <td>රු. ${(parseFloat(fields['VAS Revenue']) || 0).toFixed(2)}</td>
                <td class="fw-bold text-success">රු. ${grossValue.toFixed(2)}</td>
                <td><span class="badge bg-secondary">${fields['Settlement Type'] || 'Cash'}</span></td>
                <td class="small text-muted">${recordDate.toLocaleDateString()}</td>
                <td><span class="badge bg-light text-dark">Open</span></td>
            </tr>`;
    }).join('');

    // Inject aggregates straight into UI indicator points
    if (document.getElementById('metricGrossCollected')) {
        document.getElementById('metricGrossCollected').innerText = `රු. ${totalGrossCollected.toFixed(2)}`;
    }
    if (document.getElementById('metricCommissionOutflow')) {
        document.getElementById('metricCommissionOutflow').innerText = `රු. ${totalCommissionOutflow.toFixed(2)}`;
    }
    if (document.getElementById('metricNetHouseRevenue')) {
        document.getElementById('metricNetHouseRevenue').innerText = `රු. ${totalNetHouseRevenue.toFixed(2)}`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('financials-table-body')) {
        fetchAndRenderFinancialMetricsOverview();
    }
});
