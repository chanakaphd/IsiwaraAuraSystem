/**
 * js/financials.js
 * Financial Dashboards Analytics Renderer Node
 */

async function fetchAndRenderFinancialMetricsOverview() {
    const domTableContainerBody = document.getElementById('financials-table-body');
    if (!domTableContainerBody) return;

    domTableContainerBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Fetching transactions from database ledgers...</td></tr>`;

    const dynamicIncomingLedgerRecords = await fetchAirtableTableRecords('Financial Ledger');

    let grossMTDCollectedSum = 0;
    let commissionMTDOutflowSum = 0;
    let netHouseMTDProfitSum = 0;

    const benchmarkCurrentYearValue = new Date().getFullYear();
    const benchmarkCurrentMonthValue = new Date().getMonth();

    if (dynamicIncomingLedgerRecords.length === 0) {
        domTableContainerBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">No entries verified inside cash logs.</td></tr>`;
        return;
    }

    domTableContainerBody.innerHTML = dynamicIncomingLedgerRecords.map(row => {
        const fields = row.fields;
        const transactionTimestampDate = new Date(fields['Transaction Timestamp'] || row.createdTime);

        const extractedGrossCollected = parseFloat(fields['Gross Collected']) || 0;
        const extractedCalculatedCommission = parseFloat(fields['Calculated Commission']) || 0;
        const extractedNetRevenue = parseFloat(fields['Net Revenue']) || 0;

        if (transactionTimestampDate.getFullYear() === benchmarkCurrentYearValue && transactionTimestampDate.getMonth() === benchmarkCurrentMonthValue) {
            grossMTDCollectedSum += extractedGrossCollected;
            commissionMTDOutflowSum += extractedCalculatedCommission;
            netHouseMTDProfitSum += extractedNetRevenue;
        }

        return `
            <tr>
                <td><strong class="font-monospace text-success">${row.id.slice(-6).toUpperCase()}</strong></td>
                <td>👤 ${fields['Guest Name Reference'] || 'Spa Counter Guest'}</td>
                <td>රු. ${(parseFloat(fields['Base Revenue']) || 0).toFixed(2)}</td>
                <td>රු. ${(parseFloat(fields['VAS Revenue']) || 0).toFixed(2)}</td>
                <td class="fw-bold text-success">රු. ${extractedGrossCollected.toFixed(2)}</td>
                <td><span class="badge bg-dark border border-secondary">${fields['Settlement Type'] || 'Cash'}</span></td>
                <td class="small text-muted font-monospace">${transactionTimestampDate.toLocaleDateString()}</td>
            </tr>`;
    }).join('');

    // Inject aggregates straight into metrics display points
    if (document.getElementById('metricGrossCollected')) document.getElementById('metricGrossCollected').innerText = `රු. ${grossMTDCollectedSum.toFixed(2)}`;
    if (document.getElementById('metricCommissionOutflow')) document.getElementById('metricCommissionOutflow').innerText = `රු. ${commissionMTDOutflowSum.toFixed(2)}`;
    if (document.getElementById('metricNetHouseRevenue')) document.getElementById('metricNetHouseRevenue').innerText = `රු. ${netHouseMTDProfitSum.toFixed(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('financials-table-body')) {
        fetchAndRenderFinancialMetricsOverview();
    }
});
