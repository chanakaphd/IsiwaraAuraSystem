/**
 * js/guests.js
 * Client Profiles Directory List Layer Module
 */

async function fetchAndRenderClientProfileMatrixGrid() {
    const rootTargetContainerTableBody = document.getElementById('guest-table-body');
    if (!rootTargetContainerTableBody) return;

    rootTargetContainerTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Syncing client profiles...</td></tr>`;

    const downstreamGuestsCollectionRecords = await fetchAirtableTableRecords('Guests');

    if (downstreamGuestsCollectionRecords.length === 0) {
        rootTargetContainerTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No profile indexes built.</td></tr>`;
        return;
    }

    rootTargetContainerTableBody.innerHTML = downstreamGuestsCollectionRecords.map(profile => {
        const fields = profile.fields;
        return `
            <tr>
                <td><strong class="font-monospace text-muted">${profile.id.slice(-6).toUpperCase()}</strong></td>
                <td class="fw-bold text-success">👤 ${fields['Full Name'] || 'Walk-In Customer'}</td>
                <td>${fields['Country'] || 'Sri Lanka'}</td>
                <td class="font-monospace small text-white-50">${fields['Phone Number'] || 'N/A'}</td>
                <td class="small">${fields['Email'] || 'N/A'}</td>
                <td><span class="badge bg-dark text-slate">${fields['Hotel / Staying Place'] || 'Counter Walk-In'}</span></td>
            </tr>`;
    }).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('guest-table-body')) {
        fetchAndRenderClientProfileMatrixGrid();
    }
});
