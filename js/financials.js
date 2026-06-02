/**
 * Isiwara Aura - Financial Ledger Table View Renderer
 */

async function fetchAndRenderFinancialsListView() {
    const tableBody = document.getElementById('financials-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-3 font-monospace small">Streaming double-entry ledger rows...</td></tr>`;

    try {
        const financialsData = await fetchAirtableTableRecords('Financial Ledger');
        const activeFinancials = financialsData || [];

        tableBody.innerHTML = activeFinancials.map(ledger => {
            const fields = ledger.fields;
            const tStamp = fields['Transaction Timestamp'] || ledger.createdTime || '';
            const formattedDate = tStamp ? new Date(tStamp).toLocaleString() : 'N/A';
            
            return `
                <tr class="animate-fade-in">
                    <td><strong>${fields['Ledger ID'] || 'LED-PRX'}</strong></td>
                    <td>👤 ${fields['Guest Name Reference'] || 'Walk-In Customer'}</td>
                    <td>රු. ${(fields['Base Revenue'] || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td>රු. ${(fields['VAS Revenue'] || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td class="fw-bold text-success">රු. ${(fields['Gross Collected'] || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td><span class="badge bg-secondary">${fields['Settlement Type'] || 'Cash'}</span></td>
                    <td class="small text-muted">${formattedDate}</td>
                    <td><span class="badge bg-dark">Unlocked</span></td>
                </tr>
            `;
        }).join('');

        if (activeFinancials.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-3 text-muted">No finalized accounting trails recorded.</td></tr>`;
        }
    } catch (err) {
        console.error("Financial render failure:", err);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-danger text-center py-3">⚠️ Failed to synchronize financial rows layout.</td></tr>`;
    }
}

// Global scope auto-execution mapping
document.addEventListener("DOMContentLoaded", () => {
    if (typeof showTab === 'function') {
        const originalShowTab = window.showTab;
        window.showTab = function(tabName) {
            originalShowTab(tabName);
            if (tabName === 'financials') {
                fetchAndRenderFinancialsListView();
            }
        };
    }
});
