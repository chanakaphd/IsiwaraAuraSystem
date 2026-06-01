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
        let financialsData = await fetchAirtableTableRecords('Financial Ledger');
        if (!financialsData || financialsData.length === 0) {
            financialsData = await fetchAirtableTableRecords('Financial Ledgers');
        }

        let commissionsData = await fetchAirtableTableRecords('Commissions Ledger');
        if (!commissionsData || commissionsData.length === 0) {
            commissionsData = await fetchAirtableTableRecords('Commissions Ledgers');
        }

        const bookingsData = await fetchAirtableTableRecords('Bookings?sort[0][field]=Start%20Time&sort[0][direction]=desc');

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

            return `
                <tr class="animate-fade-in">
                    <td><strong>${fields['Booking ID'] || 'BKG-PRX'}</strong></td>
                    <td>🚪 ${fields['Room Number']?.[0] || 'Standard Room'}</td>
                    <td>👤 ${fields['Room Number']?.[1] || 'Direct Walk-In'}</td>
                    <td class="fw-bold text-success">${printedRevenueValue}</td>
                    <td><span class="badge bg-success">${fields['Status'] || 'Pending'}</span></td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error("Dashboard render exception:", error);
    }
}

/**
 * ⚡ MASTER POS TRACK ENGINE (ROBUST STRING & ATTRIBUTE SELECTORS)
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const selectedRoomFullText = document.getElementById('bulkIntakeRoomSelect').value;
                const parsedRoomClean = selectedRoomFullText.split(' ')[0].trim();
                let resolvedAirtableRoomId = "";
                
                if (typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    const matchedRoomObject = cacheRooms.find(r => String(r.fields['Room Number'] || '').trim() === parsedRoomClean);
                    if (matchedRoomObject) resolvedAirtableRoomId = matchedRoomObject.id; 
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

                for (let container of activeRows) {
                    const nameField = container.querySelector('.guest-name-input') || container.querySelector('input[type="text"]');
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;
                    
                    // 🧠 SPECIFIC SELECTOR MATCHING: Resolves index positioning dependency bugs entirely
                    const pInputField = container.querySelector('.package-price-input') || container.querySelector('[id*="Price"]') || container.querySelector('input[type="number"]');
                    const vInputField = container.querySelector('.vas-fee-input') || container.querySelector('[id*="Vas"]') || container.querySelector('[placeholder*="VAS"]');
                    const dInputField = container.querySelector('.discount-input') || container.querySelector('[id*="Discount"]') || container.querySelector('[placeholder*="Discount"]');

                    const rawPackagePrice = pInputField ? parseFloat(pInputField.value) || 0 : 0;
                    const manualVasFee = vInputField ? parseFloat(vInputField.value) || 0 : 0;
                    const discountPercentage = dInputField ? parseFloat(dInputField.value) || 0 : 0;
                    
                    const discountValueAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - discountValueAmount;

                    // Direct creation request to Guests table
                    let matchedGuest = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!matchedGuest || !matchedGuest.id) continue;

                    let createdBookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [matchedGuest.id],
                        "Room": [resolvedAirtableRoomId],
                        "Status": "Pending"
                    });

                    if (createdBookingRecord && createdBookingRecord.id) {
                        const financialPayload = {
                            "Booking Link": [createdBookingRecord.id],
                            "Base Revenue": Number(netBaseRevenue) || 0,
                            "VAS Revenue": Number(manualVasFee) || 0,
                            "Settlement Type": settlementMethodPathway
                        };

                        let finRes = await dispatchPostRESTRequestHandshake('Financial Ledgers', financialPayload);
                        if (!finRes) await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);

                        if (resolvedIntroducerRecordId) {
                            const commissionsPayload = {
                                "Booking Link": [createdBookingRecord.id],
                                "Introducer Link": [resolvedIntroducerRecordId],
                                "Total Volume Base": Number(rawPackagePrice + manualVasFee) || 0,
                                "Commission Percentage": commissionBasisType === 'PCT' ? (parseInt(commissionInputAmount, 10) || 0) : 0,
                                "Payout Status": "Pending"
                            };

                            let commRes = await dispatchPostRESTRequestHandshake('Commissions Ledger', commissionsPayload);
                            if (!commRes) await dispatchPostRESTRequestHandshake('Commissions Ledgers', commissionsPayload);
                        }
                    }
                }

                if (typeof safeCloseModal === 'function') safeCloseModal('bulkIntakeModal');
                bulkIntakeForm.reset();
                if (typeof fetchAndRenderMasterScheduleView === 'function') await fetchAndRenderMasterScheduleView();

            } catch (executionError) {
                console.error("POS Matrix Error:", executionError);
            }
        };
    }
});
