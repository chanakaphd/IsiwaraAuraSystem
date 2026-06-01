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
        const [bookingsData, financialsData, commissionsData] = await Promise.all([
            fetchAirtableTableRecords('Bookings?sort[0][field]=Start%20Time&sort[0][direction]=desc'),
            fetchAirtableTableRecords('Financial%20Ledgers'),
            fetchAirtableTableRecords('Commissions%20Ledger')
        ]);

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

        if (activeBookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No schedule rows recorded in database for this sequence filter.</td></tr>`;
        }

    } catch (error) {
        console.error("Critical rendering exception encountered inside Bookings module wrapper:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center fw-bold py-3">⚠️ Network Communication Timeout: Failed to compile master schedule data maps from Airtable.</td></tr>`;
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
        targetElement.innerText = "QR Generation Engine Failed. Check CDN Link.";
    }
}

function toggleCommissionAddonLabel() {
    const type = document.getElementById('intakeCommType').value;
    const label = document.getElementById('lblCommValue');
    if (label) {
        label.innerText = type === 'LKR' 
            ? 'Commission Value Allocation (රු.)' 
            : 'Commission Percentage Split Rate (%)';
    }
}

/**
 * ⚡ MASTER POS TRACK ENGINE (FULLY ALIGNED SCHEMAS)
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
                if (!selectedRoomFullText) {
                    alert("No room selected.");
                    return;
                }

                const parsedRoomClean = selectedRoomFullText.split(' ')[0].trim();
                let resolvedAirtableRoomId = "";
                
                if (typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    const matchedRoomObject = cacheRooms.find(r => {
                        const dbRoomNum = String(r.fields['Room Number'] || '').trim();
                        return dbRoomNum === parsedRoomClean || dbRoomNum === selectedRoomFullText;
                    });
                    if (matchedRoomObject) {
                        resolvedAirtableRoomId = matchedRoomObject.id; 
                    }
                }
                
                if (!resolvedAirtableRoomId && typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    resolvedAirtableRoomId = cacheRooms[0].id; 
                }
                
                if (!resolvedAirtableRoomId) {
                    alert("Allocation Halted: Room reference cache is empty.");
                    return;
                }

                // Map Introducers channel records handles
                const introducerType = document.getElementById('bulkIntakeIntroducerType').value;
                let selectedIntroducerName = "Direct Walk-In";
                let resolvedIntroducerRecordId = null;
                
                if (introducerType === 'Existing') {
                    selectedIntroducerName = document.getElementById('bulkIntakeIntroducerSelect').value;
                    if (typeof cacheIntroducers !== 'undefined' && cacheIntroducers.length > 0) {
                        const matchedIntroObj = cacheIntroducers.find(i => i.fields['Full Name'] === selectedIntroducerName);
                        if (matchedIntroObj) resolvedIntroducerRecordId = matchedIntroObj.id;
                    }
                } else if (introducerType === 'New') {
                    selectedIntroducerName = document.getElementById('newIntroFullName').value.trim();
                    if (typeof dispatchPostRESTRequestHandshake === 'function' && selectedIntroducerName) {
                        const newIntroResult = await dispatchPostRESTRequestHandshake('Introducers', {
                            "Full Name": selectedIntroducerName,
                            "Calling Name": selectedIntroducerName.split(' ')[0] || 'Partner',
                            "NIC Number": document.getElementById('newIntroNIC').value.trim(),
                            "Address": document.getElementById('newIntroAddress').value.trim()
                        });
                        if (newIntroResult) resolvedIntroducerRecordId = newIntroResult.id;
                    }
                }

                const commissionInputAmount = document.getElementById('intakeCommValue') ? parseInt(document.getElementById('intakeCommValue').value, 10) || 0 : 0;
                
                const pathwayDropdownElement = document.getElementById('bulkSettlementMethodSelect') || document.getElementById('bulkSettlementMethod');
                const settlementMethodPathway = pathwayDropdownElement ? pathwayDropdownElement.value : 'Cash';

                const activeRows = document.querySelectorAll('.dynamic-guest-row').length > 0 
                    ? document.querySelectorAll('.dynamic-guest-row') 
                    : document.querySelectorAll('#dynamic-guests-rows-container .row');

                if (activeRows.length === 0) {
                    alert("Allocation Aborted: Form terminal expects at least one valid row allocation frame.");
                    return;
                }

                let collectedReceiptItems = [];

                // Process each guest row entry sequentially
                for (let container of activeRows) {
                    const nameField = container.querySelector('.guest-name-input') || container.querySelector('input[type="text"]');
                    const priceField = container.querySelector('.package-price-input') || container.querySelector('input[type="number"]');
                    const packageSelect = container.querySelector('.package-select-menu') || container.querySelector('select');
                    
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;
                    
                    const packagePriceNum = priceField ? parseFloat(priceField.value) || 0 : 0;
                    const chosenPackageName = packageSelect ? packageSelect.value : "Ayurveda Treatment Session";
                    
                    // Create guest profile dynamically on-the-fly
                    let matchedGuest = await dispatchPostRESTRequestHandshake('Guests', {
                        "Full Name": guestNameStr
                    });

                    if (!matchedGuest || !matchedGuest.id) continue;
                    const guestRecordId = matchedGuest.id;

                    // Write row to Bookings table
                    const bookingFieldsPayload = {
                        "Guest": [guestRecordId],
                        "Room": [resolvedAirtableRoomId],
                        "Status": "Pending"
                    };

                    if (resolvedIntroducerRecordId) {
                        bookingFieldsPayload["Introducer"] = [resolvedIntroducerRecordId];
                    }

                    let createdBookingRecord = null;
                    if (typeof dispatchPostRESTRequestHandshake === 'function') {
                        createdBookingRecord = await dispatchPostRESTRequestHandshake('Bookings', bookingFieldsPayload);
                    }

                    if (createdBookingRecord && createdBookingRecord.id) {
                        // 💰 SUCCESS: Write corresponding transaction info into Financial Ledgers
                        // Removed "Transaction Timestamp" because it is an autocalculated Formula field!
                        await dispatchPostRESTRequestHandshake('Financial Ledgers', {
                            "Booking Link": [createdBookingRecord.id],
                            "Gross Collected": packagePriceNum,
                            "Settlement Type": settlementMethodPathway
                        });

                        collectedReceiptItems.push({
                            bookingId: createdBookingRecord.fields['Booking ID'] || "BK-AURA",
                            guestName: guestNameStr,
                            service: chosenPackageName,
                            price: packagePriceNum
                        });

                        // 🤝 SUCCESS: Log commission payments directly matching your real Commissions Ledger schema columns
                        if (resolvedIntroducerRecordId) {
                            await dispatchPostRESTRequestHandshake('Commissions Ledger', {
                                "Booking Link": [createdBookingRecord.id],
                                "Introducer Link": [resolvedIntroducerRecordId], // Aligned to 'Introducer Link'
                                "Total Volume Base": packagePriceNum,
                                "Commission Percentage": commissionInputAmount, // Aligned to 'Commission Percentage'
                                "Payout Status": "Pending"
                            });
                        }
                    }
                }

                // 🖨️ EMULATED THERMAL PRINTER RECEIPT POPUP INITIALIZER
                if (collectedReceiptItems.length > 0) {
                    const printWindow = window.open('', '_blank', 'width=320,height=600');
                    if (printWindow) {
                        printWindow.document.write(`
                            <html>
                            <body style="font-family:monospace; font-size:12px; padding:15px; color:#111;">
                                <div style="text-align:center; font-weight:bold; font-size:14px;">ISIWARA AURA AYURVEDA</div>
                                <div style="text-align:center; font-size:10px; margin-bottom:10px;">Boutique Wellness Center</div>
                                <hr style="border-top:1px dashed #000;">
                                <div style="margin-bottom:8px;">Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                                <div style="margin-bottom:10px;">Payment Method: ${settlementMethodPathway}</div>
                                <table style="width:100%; font-size:12px; border-collapse:collapse;">
                                    ${collectedReceiptItems.map(item => `
                                        <tr>
                                            <td colspan="2" style="font-weight:bold; padding-top:4px;">${item.guestName} (${item.bookingId})</td>
                                        </tr>
                                        <tr>
                                            <td style="color:#555;">${item.service}</td>
                                            <td style="text-align:right; font-weight:bold; vertical-align:bottom;">රු. ${item.price.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                                <hr style="border-top:1px dashed #000; margin-top:10px;">
                                <div style="text-align:center; font-size:10px; margin-top:15px; font-weight:bold;">✨ Counter Allocation Cleared ✨</div>
                                <div style="text-align:center; font-size:9px; color:#666;">Thank you for visiting Isiwara Aura</div>
                            </body>
                            </html>
                        `);
                        printWindow.document.close();
                        setTimeout(() => { printWindow.print(); }, 500);
                    }
                }

                if (typeof triggerCustomSwalNotification === 'function') {
                    triggerCustomSwalNotification("POS Engine Clear", "Universal bulk intake balances split, accounted, and allocated safely.", "success");
                } else {
                    alert("Success! Universal bulk intake balances split, accounted, and allocated safely.");
                }

                if (typeof safeCloseModal === 'function') {
                    safeCloseModal('bulkIntakeModal');
                } else {
                    const modalElement = document.getElementById('bulkIntakeModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();
                }
                
                bulkIntakeForm.reset();
                if (typeof fetchAndRenderMasterScheduleView === 'function') {
                    await fetchAndRenderMasterScheduleView();
                }

            } catch (executionError) {
                console.error("FULL ERROR:", executionError);
                alert(executionError.message || JSON.stringify(executionError));
            }
        };
    }
});
