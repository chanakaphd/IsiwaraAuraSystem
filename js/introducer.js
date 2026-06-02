/**
 * Isiwara Aura - Introducer Agency Ledger Tracking Dashboard
 */

async function fetchAndRenderIntroducerPerformanceMetrics() {
    const listBody = document.getElementById('introducer-ledger-table-body');
    if (!listBody) return;

    listBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted font-monospace small">Extracting partner performance histories...</td></tr>`;
    
    const commissionRecords = await fetchAirtableTableRecords('Commissions Ledger');
    
    if (commissionRecords.length === 0) {
        listBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No agency commissions recorded on cloud.</td></tr>`;
        return;
    }

    listBody.innerHTML = commissionRecords.map(record => {
        const fields = record.fields;
        
        // Extract database mapping references
        const lookupBookingId = fields['Booking ID'] || 'BKG-AURA';
        const partnerNameStr = fields['Introducer Name Lookup'] || 'Active Partner';
        const generatedVolumeBase = parseFloat(fields['Total Volume Base']) || 0;
        const actualPayoutDue = parseFloat(fields['Payout Due Amount']) || 0; // Calculated on Airtable side
        const activePayoutStatus = fields['Payout Status'] || 'Pending';

        const statusBadgeClass = activePayoutStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark';

        return `
            <tr>
                <td><strong class="font-monospace">${lookupBookingId}</strong></td>
                <td>🤝 ${partnerNameStr}</td>
                <td class="font-monospace">රු. ${generatedVolumeBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="font-monospace fw-bold text-primary">රු. ${actualPayoutDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td><span class="badge ${statusBadgeClass}">${activePayoutStatus}</span></td>
            </tr>
        `;
    }).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('introducer-ledger-table-body')) {
        fetchAndRenderIntroducerPerformanceMetrics();
    }
});
