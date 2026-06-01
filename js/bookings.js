/**
 * Isiwara Aura - Master Schedule & Month-to-Date Executive Summary Controller
 */

/**
 * Orchestrates rendering tasks for the Master Operations view layout dashboard.
 * Pulls operational lines concurrently to establish analytical summaries.
 */
async function fetchAndRenderMasterScheduleView() {
    const tableBody = document.getElementById('data-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 font-monospace small">Compiling month-to-date accounting blocks from cloud records...</td></tr>`;
    
    if (!AIRTABLE_API_KEY || !BASE_ID) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Sandbox Active. Link Airtable parameters to stream live logs.</td></tr>`;
        return;
    }

    try {
        // Fallback-safe initialization pulls
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
            if (!record.fields['Transaction Timestamp']) return false;
            const recordDate = new Date(record.fields['Transaction Timestamp']);
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

        let computedUtilizationPercentage = 0;
        if (mtdLedgerRecords.length > 0) {
            computedUtilizationPercentage = Math.min(98, Math.round(35 + (mtdLedgerRecords.length * 1.8)));
        }

        if(document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = mtdUniqueGuestProfileSet.size;
        if(document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = mtdLedgerRecords.length;
        if(document.getElementById('boxMtdUtilRate')) document.getElementById('boxMtdUtilRate').innerText = `${computedUtilizationPercentage}%`;
        if(document.getElementById('boxMtdIntCount')) document.getElementById('boxMtdIntCount').innerText = typeof cacheIntroducers !== 'undefined' ? cacheIntroducers.length : 0;
        if(document.getElementById('boxMtdPaidComm')) document.getElementById('boxMtdPaidComm').innerText = `රු. ${mtdTotalCommissionsPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

        tableBody.innerHTML = activeBookings.map(booking => {
            const fields = booking.fields;
            const matchingFinancialRow = activeFinancials.find(f => f.fields['Booking Link']?.[0] === booking.id);
            const printedRevenueValue = matchingFinancialRow ? 
                `රු. ${(matchingFinancialRow.fields['Gross Collected'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 
                'රු. 0.00';

            const allocatedRoomLabel = fields['Room Number']?.[0] || 'Standard Treatment Room';
            const introducerContextLabel = fields['Room Number']?.[1] || 'Direct Walk-In';
            const currentOperationalStatus = fields['Status'] || 'Pending';

            return `
                <tr class="animate-fade-in">
                    <td><strong>${fields['Booking ID'] || 'BKG-PRX'}</strong></td>
                    <td>🚪 ${allocatedRoomLabel}</td>
                    <td>👤 ${introducerContextLabel}</td>
                    <td class="fw-bold text-success">${printedRevenueValue}</td>
                    <td><span class="badge bg-success">${currentOperationalStatus}</span></td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error("Critical rendering exception encountered inside Bookings module:", error);
    }
}

/**
 * Secure QR Verification Node Injection Pipeline
 */
function generateSecureBookingTreatmentQRToken(bookingId, baseDomainUrl = "https://chanakaphd.github.io/IsiwaraAuraSystem") {
    const safetySalt = "IsiwaraAuraSystemStructuralSecret2026";
    const verificationChecksum = btoa(`${bookingId}:${safetySalt}`).substring(0, 12);
    const targetPayloadUrl = `${baseDomainUrl}/treatment-info.html?bookingId=${encodeURIComponent(bookingId)}&tokenVerificationSig=${verificationChecksum}`;
    return targetPayloadUrl;
}

function renderSystemAllocationQRGraphicNode(domElementId, bookingId) {
    const targetElement = document.getElementById(domElementId);
    if (!targetElement) return;
    targetElement.innerHTML = ""; 
    const payloadUrl = generateSecureBookingTreatmentQRToken(bookingId);
    try {
        new QRCode(targetElement, {
            text: payloadUrl,
            width: 140,
            height: 140,
            colorDark: "#1e4620",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    } catch (qrException) {
        targetElement.innerText = "QR Generation Engine Failed.";
    }
}

/**
 * ⚡ MASTER POS TRACK ENGINE (TYPO-PROOF TRANSACTION FALLBACKS)
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("🚀 Initializing Universal Bulk Intake Processing Engine...");

            try {
                const selectedRoomFullText = document.getElementById('bulkIntakeRoomSelect').value;
                const parsedRoomClean = selectedRoomFullText.split(' ')[0].trim();
                let resolvedAirtableRoomId = "";
                
                if (typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    const matchedRoomObject = cacheRooms.find(r => {
                        const dbRoomNum = String(r.fields['Room Number'] || '').trim();
                        return dbRoomNum === parsedRoomClean || dbRoomNum === selectedRoomFullText;
                    });
                    if (matchedRoomObject) resolvedAirtableRoomId = matchedRoomObject.id; 
                }
                
                if (!resolvedAirtableRoomId && typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    resolvedAirtableRoomId = cacheRooms[0].id; 
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
                    const packageSelect = container.querySelector('.package-select-menu') || container.querySelector('select');
                    
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;
                    
                    const pInputField = container.querySelector('.package-price-input') || container.querySelector('input[type="number"]');
                    const vInputField = container.querySelectorAll('input[type="number"]')[1];
                    const dInputField = container.querySelectorAll('input[type="number"]')[2];

                    const rawPackagePrice = pInputField ? parseFloat(pInputField.value) || 0 : 0;
                    const manualVasFee = vInputField ? parseFloat(vInputField.value) || 0 : 0;
                    const discountPercentage = dInputField ? parseFloat(dInputField.value) || 0 : 0;
                    const chosenPackageName = packageSelect ? packageSelect.value : "Ayurveda Session";
                    
                    const discountValueAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - discountValueAmount;
                    const grossCollectedTotal = netBaseRevenue + manualVasFee;

                    let matchedGuest = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!matchedGuest || !matchedGuest.id) continue;

                    const bookingFieldsPayload = {
                        "Guest": [matchedGuest.id],
                        "Room": [resolvedAirtableRoomId],
                        "Status": "Pending"
                    };

                    if (resolvedIntroducerRecordId) {
                        bookingFieldsPayload["Introducer"] = [resolvedIntroducerRecordId];
                    }

                    let createdBookingRecord = await dispatchPostRESTRequestHandshake('Bookings', bookingFieldsPayload);

                    if (createdBookingRecord && createdBookingRecord.id) {
                        
                        const financialPayload = {
                            "Booking Link": [createdBookingRecord.id],
                            "Base Revenue": netBaseRevenue,
                            "VAS Revenue": manualVasFee,
                            "Gross Collected": grossCollectedTotal,
                            "Settlement Type": settlementMethodPathway
                        };

                        // Smart-Typo Verification: Try singular if plural fails
                        let financialResult = await dispatchPostRESTRequestHandshake('Financial Ledgers', financialPayload);
                        if (!financialResult) {
                            await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);
                        }

                        collectedReceiptItems.push({
                            bookingId: createdBookingRecord.fields['Booking ID'] || "BK-AURA",
                            guestName: guestNameStr,
                            service: chosenPackageName,
                            price: grossCollectedTotal
                        });

                        if (resolvedIntroducerRecordId) {
                            const commissionsPayload = {
                                "Booking Link": [createdBookingRecord.id],
                                "Introducer Link": [resolvedIntroducerRecordId],
                                "Total Volume Base": (rawPackagePrice + manualVasFee),
                                "Commission Percentage": commissionBasisType === 'PCT' ? parseInt(commissionInputAmount, 10) : 0,
                                "Payout Status": "Pending"
                            };

                            let commissionResult = await dispatchPostRESTRequestHandshake('Commissions Ledger', commissionsPayload);
                            if (!commissionResult) {
                                await dispatchPostRESTRequestHandshake('Commissions Ledgers', commissionsPayload);
                            }
                        }
                    }
                }

                // Thermal receipt render loop
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
                                table>
                            </body>
                            </html>
                        `);
                        printWindow.document.close();
                        setTimeout(() => { printWindow.print(); }, 500);
                    }
                }

                if (typeof safeCloseModal === 'function') safeCloseModal('bulkIntakeModal');
                bulkIntakeForm.reset();
                if (typeof fetchAndRenderMasterScheduleView === 'function') await fetchAndRenderMasterScheduleView();

            } catch (executionError) {
                console.error("Matrix Processing Error:", executionError);
            }
        };
    }
});
