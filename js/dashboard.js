/**
 * Isiwara Aura - Core Dashboard & Master Schedule View Module
 */

async function fetchAndRenderMasterScheduleView() {
    const tableBody = document.getElementById('data-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Compiling master workflow tracking tables...</td></tr>`;

    const [bookings, financials] = await Promise.all([
        fetchAirtableTableRecords('Bookings'),
        fetchAirtableTableRecords('Financial Ledger')
    ]);

    // Update operational counter summary indicators info blocks
    if (document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = bookings.length;
    if (document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = bookings.length;

    if (bookings.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Master operational logs are completely clear.</td></tr>`;
        return;
    }

    tableBody.innerHTML = bookings.map(booking => {
        const fields = booking.fields;
        
        // Match matching row components manually for quick reference display
        const matchedFinance = financials.find(f => f.fields['Booking Link']?.[0] === booking.id);
        const revenue = matchedFinance ? (parseFloat(matchedFinance.fields['Gross Collected']) || 0).toFixed(2) : '0.00';

        return `
            <tr>
                <td><strong class="font-monospace text-success">${booking.id.slice(-6).toUpperCase()}</strong></td>
                <td>🚪 ${fields['Room Name Lookup'] || 'Treatment Area'}</td>
                <td>🤝 ${fields['Introducer Name Lookup'] || 'Direct Entry'}</td>
                <td class="fw-bold text-dark">රු. ${revenue}</td>
                <td><span class="badge bg-success">${fields['Status'] || 'Completed'}</span></td>
            </tr>`;
    }).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('data-table-body')) {
        fetchAndRenderMasterScheduleView();
    }
});
