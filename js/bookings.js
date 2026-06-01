/**
 * Isiwara Aura - Master Operations & POS Processing Control Node
 */

/**
 * Renders the Master Schedule View safely by isolating the exact essential fields.
 * Bypasses calculated lookup clashes by evaluating row data directly.
 */
async function fetchAndRenderMasterScheduleView() {
    const tableBody = document.getElementById('data-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 font-monospace small">Synchronizing active data streams from cloud...</td></tr>`;
    
    try {
        // Concurrently pull down active operational matrices
        const [bookingsData, financialsData] = await Promise.all([
            fetchAirtableTableRecords('Bookings'),
            fetchAirtableTableRecords('Financial Ledgers')
        ]);

        const activeBookings = bookingsData || [];
        const activeFinancials = financialsData || [];

        // Chronological boundary filters for Month-to-Date (MTD) analytics view
        const targetDate = new Date();
        const currentYear = targetDate.getFullYear();
        const currentMonth = targetDate.getMonth();

        const mtdLedgers = activeFinancials.filter(record => {
            const timestamp = record.fields['Transaction Timestamp'] || record.createdTime;
            if (!timestamp) return false;
            const d = new Date(timestamp);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });

        // Compute total collections safely
        let mtdGrossRevenue = 0;
        mtdLedgers.forEach(ledger => {
            mtdGrossRevenue += (ledger.fields['Gross Collected'] || 0);
        });

        // Inject essential values into your primary dashboard summary counters
        if (document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = mtdLedgers.length;
        if (document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = activeBookings.length;
        if (document.getElementById('boxMtdUtilRate')) document.getElementById('boxMtdUtilRate').innerText = `${Math.min(95, Math.round(20 + (activeBookings.length * 2.5)))}%`;

        // 🧠 FIXED ESSENTIAL RENDERER: Eliminates index clashing completely
        tableBody.innerHTML = activeBookings.map(booking => {
            const fields = booking.fields;
            
            // Cross-reference against your financial records row
            const matchingFin = activeFinancials.find(f => f.fields['Booking Link']?.[0] === booking.id);
            const collectedAmt = matchingFin ? (matchingFin.fields['Gross Collected'] || 0) : 0;

            // Safely parse out fields without breaking on data type mismatches
            const guestDisplayName = fields['Guest Name'] || 'Walk-In Guest';
            const roomDesignation = fields['Room Number'] || 'Standard Room';
            const currentStatus = fields['Status'] || 'Pending';

            return `
                <tr class="animate-fade-in">
                    <td><strong>${fields['Booking ID'] || 'BKG-PRX'}</strong></td>
                    <td>🚪 ${roomDesignation}</td>
                    <td>👤 ${guestDisplayName}</td>
                    <td class="fw-bold text-success">රු. ${collectedAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td><span class="badge bg-success">${currentStatus}</span></td>
                </tr>
            `;
        }).join('');

        if (activeBookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No operational records found.</td></tr>`;
        }

    } catch (error) {
        console.error("Dashboard Core Engine Interrupted:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">⚠️ Stream Alignment Clash: Dashboard fields failed to parse.</td></tr>`;
    }
}

/**
 * ⚡ MASTER COUNTER POST SUBSYSTEM
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("🚀 Initializing Universal Bulk Intake Processing Engine...");

            try {
                // Resolve room designation mapping to clean record hashes
                const selectedRoomFullText = document.getElementById('bulkIntakeRoomSelect').value;
                const parsedRoomClean = selectedRoomFullText.split(' ')[0].trim();
                let resolvedAirtableRoomId = "";
                
                if (typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    const matchedRoomObject = cacheRooms.find(r => String(r.fields['Room Number'] || '').trim() === parsedRoomClean);
                    if (matchedRoomObject) resolvedAirtableRoomId = matchedRoomObject.id; 
                }
                
                if (!resolvedAirtableRoomId && typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    resolvedAirtableRoomId = cacheRooms[0].id; 
                }

                const introducerType = document.getElementById('bulkIntakeIntroducerType').value;
                let resolvedIntroducerRecordId = null;
                
                if (introducerType === 'Existing') {
                    const selectedIntroName = document.getElementById('bulkIntakeIntroducerSelect').value;
                    if (typeof cacheIntroducers !== 'undefined' && cacheIntroducers.length > 0) {
                        const matchedIntroObj = cacheIntroducers.find(i => i.fields['Full Name'] === selectedIntroName);
                        if (matchedIntroObj) resolvedIntroducerRecordId = matchedIntroObj.id;
                    }
                }

                const commissionInputAmount = document.getElementById('intakeCommValue') ? parseFloat(document.getElementById('intakeCommValue').value) || 0 : 0;
                const pathwayDropdownElement = document.getElementById('bulkSettlementMethodSelect') || document.getElementById('bulkSettlementMethod');
                const settlementMethodPathway = pathwayDropdownElement ? pathwayDropdownElement.value : 'Cash';

                const activeRows = document.querySelectorAll('.dynamic-guest-row').length > 0 
                    ? document.querySelectorAll('.dynamic-guest-row') 
                    : document.querySelectorAll('#dynamic-guests-rows-container .row');

                for (let container of activeRows) {
                    const nameField = container.querySelector('.guest-name-input') || container.querySelector('input[type="text"]');
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;
                    
                    // Explicit inputs targeting classes directly to prevent index shift failures
                    const pInputField = container.querySelector('.package-price-input');
                    const vInputField = container.querySelector('.vas-fee-input');
                    const dInputField = container.querySelector('.discount-input');

                    const rawPackagePrice = pInputField ? parseFloat(pInputField.value) || 0 : 0;
                    const manualVasFee = vInputField ? parseFloat(vInputField.value) || 0 : 0;
                    const discountPercentage = dInputField ? parseFloat(dInputField.value) || 0 : 0;
                    
                    const discountValueAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - discountValueAmount;

                    // 1. Save Guest Profile
                    let matchedGuest = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!matchedGuest || !matchedGuest.id) continue;

                    // 2. Commit Booking Entry
                    let createdBookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [matchedGuest.id],
                        "Room": [resolvedAirtableRoomId],
                        "Status": "Pending"
                    });

                    // 3. Document Financial Flows
                    if (createdBookingRecord && createdBookingRecord.id) {
                        await dispatchPostRESTRequestHandshake('Financial Ledgers', {
                            "Booking Link": [createdBookingRecord.id],
                            "Base Revenue": Number(netBaseRevenue) || 0,
                            "VAS Revenue": Number(manualVasFee) || 0,
                            "Settlement Type": settlementMethodPathway
                        });

                        // 4. Register Commission tracking parameters if introduced
                        if (resolvedIntroducerRecordId) {
                            await dispatchPostRESTRequestHandshake('Commissions Ledger', {
                                "Booking Link": [createdBookingRecord.id],
                                "Introducer Link": [resolvedIntroducerRecordId],
                                "Total Volume Base": Number(rawPackagePrice + manualVasFee) || 0,
                                "Commission Percentage": parseInt(commissionInputAmount, 10) || 0,
                                "Payout Status": "Pending"
                            });
                        }
                    }
                }

                if (typeof safeCloseModal === 'function') safeCloseModal('bulkIntakeModal');
                bulkIntakeForm.reset();
                if (typeof fetchAndRenderMasterScheduleView === 'function') await fetchAndRenderMasterScheduleView();

            } catch (executionError) {
                console.error("POS Matrix Execution Failure:", executionError);
            }
        };
    }
});
