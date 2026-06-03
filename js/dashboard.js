/**
 * js/dashboard.js
 * Reception Core Dashboard Activity Stream Parser Module
 */

async function compileFrontDeskActiveSchedulesLogs() {
    const layoutInsertionPointNode = document.getElementById('data-table-body');
    if (!layoutInsertionPointNode) return;

    layoutInsertionPointNode.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Compiling active flow parameters...</td></tr>`;

    const [bookingsCollection, financialsCollection] = await Promise.all([
        fetchAirtableTableRecords('Bookings'),
        fetchAirtableTableRecords('Financial Ledger')
    ]);

    // Force update aggregate interface indicators labels numbers items
    if (document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = bookingsCollection.length;
    if (document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = bookingsCollection.filter(b => b.fields['Status'] === 'Completed').length;

    if (bookingsCollection.length === 0) {
        layoutInsertionPointNode.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No active workflows found.</td></tr>`;
        return;
    }

    layoutInsertionPointNode.innerHTML = bookingsCollection.map(booking => {
        const fields = booking.fields;
        
        // Relational map check logic lookup
        const matchedLedgerRow = financialsCollection.find(f => f.fields['Booking Link']?.[0] === booking.id);
        const localizedTotalRevenueStr = matchedLedgerRow ? parseFloat(matchedLedgerRow.fields['Gross Collected'] || 0).toFixed(2) : '0.00';

        return `
            <tr>
                <td><strong class="font-monospace text-success">${booking.id.slice(-6).toUpperCase()}</strong></td>
                <td>🚪 ${fields['Room Number'] || 'Main Arena Area'}</td>
                <td>🤝 ${fields['Therapist Name'] || 'Specialist Staff Assigned'}</td>
                <td class="fw-bold font-monospace text-white">රු. ${localizedTotalRevenueStr}</td>
                <td><span class="badge bg-success text-uppercase py-1 px-2 small">${fields['Status'] || 'Completed'}</span></td>
            </tr>`;
    }).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('data-table-body')) {
        compileFrontDeskActiveSchedulesLogs();
    }
});
