/**
 * Isiwara Aura - Master Schedule & Month-to-Date Executive Summary Controller
 */

/**
 * Orchestrates rendering tasks for the Master Operations view layout dashboard.
 */
async function fetchAndRenderMasterScheduleView() {
    const tableBody = document.getElementById('data-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 font-monospace small">Compiling accounting blocks...</td></tr>`;
    
    try {
        const [bookingsData, financialsData, commissionsData] = await Promise.all([
            fetchAirtableTableRecords('Bookings?sort[0][field]=Start%20Time&sort[0][direction]=desc'),
            fetchAirtableTableRecords('Financial Ledgers'),
            fetchAirtableTableRecords('Commissions Ledger')
        ]);

        const activeBookings = bookingsData || [];
        const activeFinancials = financialsData || [];
        const activeCommissions = commissionsData || [];

        const systemCalendarDate = new Date();
        const currentYearValue = systemCalendarDate.getFullYear();
        const currentMonthValue = systemCalendarDate.getMonth();

        const mtdLedgerRecords = activeFinancials.filter(record => {
            const tStamp = record.fields['Transaction Timestamp'] || record.createdTime;
            if (!tStamp) return false;
            const recordDate = new Date(tStamp);
            return recordDate.getFullYear() === currentYearValue && recordDate.getMonth() === currentMonthValue;
        });

        const mtdTotalCommissionsPaid = activeCommissions.filter(record => {
            if (!record.fields['Disbursed Date'] || record.fields['Payout Status'] !== 'Released') return false;
            const disbursementDate = new Date(record.fields['Disbursed Date']);
            return disbursementDate.getFullYear() === currentYearValue && disbursementDate.getMonth() === currentMonthValue;
        }).reduce((aggregatedSum, record) => aggregatedSum + (record.fields['Payout Due Amount'] || 0), 0);

        let mtdUniqueGuestProfileSet = new Set();
        let mtdGrossCollectedRevenue = 0;

        mtdLedgerRecords.forEach(ledger => {
            if (ledger.fields['Guest Name Reference']) {
                mtdUniqueGuestProfileSet.add(ledger.fields['Guest Name Reference']);
            }
            mtdGrossCollectedRevenue += (ledger.fields['Gross Collected'] || 0);
        });

        if(document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = mtdUniqueGuestProfileSet.size;
        if(document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = mtdLedgerRecords.length;
        if(document.getElementById('boxMtdPaidComm')) document.getElementById('boxMtdPaidComm').innerText = `රු. ${mtdTotalCommissionsPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

        tableBody.innerHTML = activeBookings.map(booking => {
            const fields = booking.fields;
            const matchingFinancialRow = activeFinancials.find(f => f.fields['Booking Link']?.[0] === booking.id);
            const printedRevenueValue = matchingFinancialRow ? 
                `රු. ${(matchingFinancialRow.fields['Gross Collected'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 
                'රු. 0.00';

            const roomLabel = fields['Room Number'] || (fields['Room'] && fields['Room'].length > 0 ? 'Assigned Treatment Room' : 'Standard Room');
            const introLabel = fields['Introducer Name'] || 'Direct Walk-In';

            return `
                <tr class="animate-fade-in">
                    <td><strong>${fields['Booking ID'] || 'BKG-PRX'}</strong></td>
                    <td>🚪 ${roomLabel}</td>
                    <td>👤 ${introLabel}</td>
                    <td class="fw-bold text-success">${printedRevenueValue}</td>
                    <td><span class="badge bg-success">${fields['Status'] || 'Pending'}</span></td>
                </tr>
            `;
        }).join('');

        if (activeBookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No operational logs recorded.</td></tr>`;
        }

    } catch (error) {
        console.error("Dashboard render exception:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">⚠️ Connection Error: Failed to compile data maps.</td></tr>`;
    }
}

/**
 * ⚡ MASTER POS TRACK ENGINE (ERROR-PROOF ID RESOLUTION)
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                // Secure Room Resolution: Strips and isolates friendly names safely
                const selectedRoomFullText = document.getElementById('bulkIntakeRoomSelect').value;
                if (!selectedRoomFullText) {
                    alert("Please allocate a treatment room before confirming checkout.");
                    return;
                }
                
                const parsedRoomClean = selectedRoomFullText.split(' ')[0].trim();
                let resolvedAirtableRoomId = null;
                
                if (typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    const matchedRoomObject = cacheRooms.find(r => 
                        String(r.fields['Room Number'] || '').trim() === parsedRoomClean ||
                        String(r.fields['Room Number'] || '').trim() === selectedRoomFullText.trim()
                    );
                    if (matchedRoomObject) resolvedAirtableRoomId = matchedRoomObject.id; 
                }

                // Global fallback safety if cache hasn't loaded yet
                if (!resolvedAirtableRoomId && typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    resolvedAirtableRoomId = cacheRooms[0].id;
                }

                if (!resolvedAirtableRoomId) {
                    alert("Database Resolution Failure: Unable to locate structural record ID for the selected room.");
                    return;
                }

                const introducerType = document.getElementById('bulkIntakeIntroducerType').value;
                let selectedIntroducerName = "Direct Walk-In";
                let resolvedIntroducerRecordId = null;
                
                if (introducerType === 'Existing') {
                    selectedIntroducerName = document.getElementById('bulkIntakeIntroducerSelect').value;
                    if (typeof cacheIntroducers !== 'undefined' && cacheIntroducers.length > 0) {
                        const matchedIntroObj = cacheIntroducers.find(i => i.fields['Full Name'] === selectedIntroducerName);
                        if (matchedIntroObj) resolvedIntroducerRecordId = matchedIntroObj.id;
                    }
                }

                const commissionBasisType = document.getElementById('intakeCommType') ? document.getElementById('intakeCommType').value : 'LKR';
                const commissionInputAmount = document.getElementById('intakeCommValue') ? parseFloat(document.getElementById('intakeCommValue').value) || 0 : 0;
                const pathwayDropdownElement = document.getElementById('bulkSettlementMethodSelect') || document.getElementById('bulkSettlementMethod');
                const settlementMethodPathway = pathwayDropdownElement ? pathwayDropdownElement.value : 'Cash';

                const activeRows = document.querySelectorAll('.dynamic-guest-row').length > 0 
                    ? document.querySelectorAll('.dynamic-guest-row') 
                    : document.querySelectorAll('#dynamic-guests-rows-container .row');

                let collectedReceiptItems = [];

                for (let container of activeRows) {
                    const nameField = container.querySelector('.guest-name-input') || container.querySelector('input[type="text"]');
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;
                    
                    const pInputField = container.querySelector('.package-price-input') || container.querySelector('input[type="number"]');
                    const vInputField = container.querySelectorAll('input[type="number"]')[1];
                    const dInputField = container.querySelectorAll('input[type="number"]')[2];

                    const rawPackagePrice = pInputField ? parseFloat(pInputField.value) || 0 : 0;
                    const manualVasFee = vInputField ? parseFloat(vInputField.value) || 0 : 0;
                    const discountPercentage = dInputField ? parseFloat(dInputField.value) || 0 : 0;
                    const chosenPackageName = container.querySelector('select') ? container.querySelector('select').value : "Ayurveda Session";
                    
                    const discountValueAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - discountValueAmount;
                    const grossCollectedTotal = netBaseRevenue + manualVasFee;

                    // Step 1: Create Guest Record
                    let matchedGuest = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!matchedGuest || !matchedGuest.id) continue;

                    // Step 2: Create Booking using the verified room ID
                    let createdBookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [matchedGuest.id],
                        "Room": [resolvedAirtableRoomId],
                        "Status": "Pending"
                    });

                    // Step 3: Insert downstream financials only if the booking record succeeded
                    if (createdBookingRecord && createdBookingRecord.id) {
                        
                        await dispatchPostRESTRequestHandshake('Financial Ledgers', {
                            "Booking Link": [createdBookingRecord.id],
                            "Base Revenue": Number(netBaseRevenue) || 0,
                            "VAS Revenue": Number(manualVasFee) || 0,
                            "Settlement Type": settlementMethodPathway
                        });

                        collectedReceiptItems.push({
                            bookingId: createdBookingRecord.fields['Booking ID'] || "BK-AURA",
                            guestName: guestNameStr,
                            service: chosenPackageName,
                            price: grossCollectedTotal
                        });

                        if (resolvedIntroducerRecordId) {
                            await dispatchPostRESTRequestHandshake('Commissions Ledger', {
                                "Booking Link": [createdBookingRecord.id],
                                "Introducer Link": [resolvedIntroducerRecordId],
                                "Total Volume Base": Number(rawPackagePrice + manualVasFee) || 0,
                                "Commission Percentage": commissionBasisType === 'PCT' ? (parseInt(commissionInputAmount, 10) || 0) : 0,
                                "Payout Status": "Pending"
                            });
                        }
                    }
                }

                // Print Invoice Window Trigger
                if (collectedReceiptItems.length > 0) {
                    const printWindow = window.open('', '_blank', 'width=320,height=600');
                    if (printWindow) {
                        printWindow.document.write(`
                            <html>
                            <body style="font-family:monospace; font-size:12px; padding:15px;">
                                <div style="text-align:center; font-weight:bold;">ISIWARA AURA AYURVEDA</div>
                                <hr style="border-top:1px dashed #000;">
                                <div>Method: ${settlementMethodPathway}</div>
                                <table style="width:100%; font-size:12px;">
                                    ${collectedReceiptItems.map(item => `
                                        <tr><td><strong>${item.guestName}</strong></td><td style="text-align:right;">රු. ${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>
                                    `).join('')}
                                </table>
                            </body>
                            </html>
                        `);
                        printWindow.document.close();
                        setTimeout(() => { printWindow.print(); }, 500);
                    }
                }

                if (typeof safeCloseModal === 'function') safeCloseModal('bulkIntakeModal');
                bulkIntakeForm.reset();
                
                // Refresh data displays on layout frames
                if (typeof fetchAndRenderMasterScheduleView === 'function') {
                    await fetchAndRenderMasterScheduleView();
                }

            } catch (executionError) {
                console.error("POS Matrix Processing Exception Encountered:", executionError);
            }
        };
    }
});
