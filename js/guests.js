/**
 * Isiwara Aura - Guest Profile Directory Matrix
 */

async function fetchAndRenderGuestRegistryMatrix() {
    const tableBody = document.getElementById('guest-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">Extracting registered client parameters...</td></tr>`;

    const guestRecords = await fetchAirtableTableRecords('Guests');

    if (guestRecords.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No client records found in database.</td></tr>`;
        return;
    }

    tableBody.innerHTML = guestRecords.map(record => {
        const fields = record.fields;
        return `
            <tr>
                <td><strong class="font-monospace text-muted">${record.id.slice(-6).toUpperCase()}</strong></td>
                <td class="fw-bold text-success">👥 ${fields['Full Name'] || 'Anonymous Guest'}</td>
                <td>🇱🇰 Sri Lanka</td>
                <td><span class="text-muted small">Not Verified</span></td>
                <td><span class="text-muted small">N/A</span></td>
                <td><span class="badge bg-light text-secondary">Walk-In Counter</span></td>
            </tr>`;
    }).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('guest-table-body')) {
        fetchAndRenderGuestRegistryMatrix();
    }
});
