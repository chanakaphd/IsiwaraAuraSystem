/**
 * Isiwara Aura - Channel Partner Ledger Dashboard
 */

async function fetchAndRenderIntroducerPerformanceMetrics() {
    const listBody = document.getElementById('introducer-ledger-table-body');
    if (!listBody) return;

    listBody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">Synchronizing channel metrics...</td></tr>`;
    
    const commissionRecords = await fetchAirtableTableRecords('Commissions Ledger');
    
    if (commissionRecords.length === 0) {
        listBody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No affiliate payouts logged on system.</td></tr>`;
        return;
    }

    listBody.innerHTML = commissionRecords.map(record => {
        const fields = record.fields;
        
        const lookupBookingId = fields['Booking ID Lookup'] || 'BKG-AURA';
        const partnerNameStr = fields['Introducer Name Lookup'] || 'Active Agent';
        const generatedVolumeBase = parseFloat(fields['Total Volume Base']) || 0;
        const ratePct = ((parseFloat(fields['Commission Percentage']) || 0) * 100).toFixed(0);
        const actualPayoutDue = parseFloat(fields['Payout Due Amount']) || 0;
        const activePayoutStatus = fields['Payout Status'] || 'Pending';

        const badgeClass = activePayoutStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark';

        return `
            <tr>
                <td><strong class="font-monospace">${lookupBookingId}</strong></td>
                <td>🤝 ${partnerNameStr}</td>
                <td class="font-monospace">රු. ${generatedVolumeBase.toFixed(2)}</td>
                <td class="font-monospace text-muted">${ratePct}%</td>
                <td class="font-monospace fw-bold text-primary">රු. ${actualPayoutDue.toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${activePayoutStatus}</span></td>
            </tr>`;
    }).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('introducer-ledger-table-body')) {
        fetchAndRenderIntroducerPerformanceMetrics();
    }
});
