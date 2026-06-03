/**
 * js/introducer.js
 * Commission Board Partner Analytics Interface Module
 */

async function fetchAndRenderIntroducerPerformanceMetrics() {
    const htmlTableBodyAnchor = document.getElementById('introducer-ledger-table-body');
    if (!htmlTableBodyAnchor) return;

    htmlTableBodyAnchor.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">Compiling affiliate records...</td></tr>`;
    
    const incomingCommissionsPayloadRecords = await fetchAirtableTableRecords('Commissions Ledger');
    
    if (incomingCommissionsPayloadRecords.length === 0) {
        htmlTableBodyAnchor.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No affiliate commission profiles written.</td></tr>`;
        return;
    }

    htmlTableBodyAnchor.innerHTML = incomingCommissionsPayloadRecords.map(item => {
        const fields = item.fields;
        
        const extractedBookingRefId = fields['Booking Link'] || 'BKG-LINK';
        const partnerIdentityString = fields['Introducer Link Profile'] || 'Active Partner';
        const flatTotalVolumeBaseValue = parseFloat(fields['Total Volume Base']) || 0;
        const applicationRatePercentage = ((parseFloat(fields['Commission Percentage']) || 0) * 100).toFixed(0);
        const computationalPayoutDue = parseFloat(fields['Payout Due Amount']) || 0;
        const currentPayoutStatusState = fields['Payout Status'] || 'Pending';

        const statusBadgeThemingClass = currentPayoutStatusState === 'Paid' ? 'bg-success' : 'bg-warning text-dark';

        return `
            <tr>
                <td><strong class="font-monospace text-white-50">${String(extractedBookingRefId).slice(0,10)}</strong></td>
                <td>🤝 ${partnerIdentityString}</td>
                <td class="font-monospace">රු. ${flatTotalVolumeBaseValue.toFixed(2)}</td>
                <td class="font-monospace text-muted">${applicationRatePercentage}%</td>
                <td class="font-monospace fw-bold text-primary">රු. ${computationalPayoutDue.toFixed(2)}</td>
                <td><span class="badge ${statusBadgeThemingClass}">${currentPayoutStatusState}</span></td>
            </tr>`;
    }).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('introducer-ledger-table-body')) {
        fetchAndRenderIntroducerPerformanceMetrics();
    }
});
