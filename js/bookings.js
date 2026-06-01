/**
 * Isiwara Aura - Production Operations & POS Accounting Double-Entry Controller
 */

/**
 * Compiles and renders active operational rows cleanly from cloud maps.
 */
async function fetchAndRenderMasterScheduleView() {
    const tableBody = document.getElementById('data-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 font-monospace small text-muted">Synchronizing active data streams from cloud...</td></tr>`;
    
    try {
        const [bookingsData, financialsData] = await Promise.all([
            fetchAirtableTableRecords('Bookings'),
            fetchAirtableTableRecords('Financial Ledgers')
        ]);

        const activeBookings = bookingsData || [];
        const activeFinancials = financialsData || [];

        const systemCalendarDate = new Date();
        const currentYearValue = systemCalendarDate.getFullYear();
        const currentMonthValue = systemCalendarDate.getMonth();

        const mtdLedgerRecords = activeFinancials.filter(record => {
            const tStamp = record.fields['Transaction Timestamp'] || record.createdTime;
            if (!tStamp) return false;
            const recordDate = new Date(tStamp);
            return recordDate.getFullYear() === currentYearValue && recordDate.getMonth() === currentMonthValue;
        });

        if(document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = mtdLedgerRecords.length;
        if(document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = activeBookings.length;
        if(document.getElementById('boxMtdUtilRate')) document.getElementById('boxMtdUtilRate').innerText = `${Math.min(98, Math.round(15 + (activeBookings.length * 2.2)))}%`;

        tableBody.innerHTML = activeBookings.map(booking => {
            const fields = booking.fields;
            const matchingFinancialRow = activeFinancials.find(f => f.fields['Booking Link']?.[0] === booking.id);
            const printedRevenueValue = matchingFinancialRow ? 
                `රු. ${(matchingFinancialRow.fields['Gross Collected'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 
                'රු. 0.00';

            const roomLabel = fields['Room Number']?.[0] || 'Treatment Room';
            const guestLabel = fields['Guest Name Reference'] || 'Walk-In Client';
            const currentOperationalStatus = fields['Status'] || 'Completed';

            const badgeClass = currentOperationalStatus === 'Completed' || currentOperationalStatus === 'Confirmed' ? 'bg-success' : 'bg-warning';

            return `
                <tr class="animate-fade-in">
                    <td><strong>${fields['Booking ID'] || 'BKG-PRX'}</strong></td>
                    <td>🚪 ${roomLabel}</td>
                    <td>👤 ${guestLabel}</td>
                    <td class="fw-bold text-success">${printedRevenueValue}</td>
                    <td><span class="badge ${badgeClass}">${currentOperationalStatus}</span></td>
                </tr>
            `;
        }).join('');

        if (activeBookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No operational records found.</td></tr>`;
        }

    } catch (error) {
        console.error("Dashboard Render Exception:", error);
    }
}

/**
 * 📊 Dynamic Interface Calculation Layer
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row');
    if (containerRows.length === 0) return;

    let totalTreatmentAmount = 0;
    let totalVasAmount = 0;
    let totalDiscountAmount = 0;
    let totalCommissionAmount = 0;

    const commissionBasisType = document.getElementById('intakeCommType') ? document.getElementById('intakeCommType').value : 'LKR';
    const commissionInputAmount = document.getElementById('intakeCommValue') ? parseFloat(document.getElementById('intakeCommValue').value) || 0 : 0;

    containerRows.forEach(row => {
        const inputs = row.querySelectorAll('input[type="number"]');
        const basePackagePrice = inputs[0] ? parseFloat(inputs[0].value) || 0 : 0;
        const manualVasFee = inputs[1] ? parseFloat(inputs[1].value) || 0 : 0;
        const discountPercentage = inputs[2] ? parseFloat(inputs[2].value) || 0 : 0;

        const calculatedDiscountVal = basePackagePrice * (discountPercentage / 100);

        totalTreatmentAmount += basePackagePrice;
        totalVasAmount += manualVasFee;
        totalDiscountAmount += calculatedDiscountVal;

        if (commissionBasisType === 'PCT') {
            totalCommissionAmount += (basePackagePrice + manualVasFee) * (commissionInputAmount / 100);
        } else {
            totalCommissionAmount += commissionInputAmount / containerRows.length;
        }
    });

    const finalFullAmountNet = (totalTreatmentAmount - totalDiscountAmount) + totalVasAmount;

    const labelCalculatedSum = document.getElementById('lblBulkTotalCalculation');
    if (labelCalculatedSum) {
        labelCalculatedSum.innerText = `රු. ${finalFullAmountNet.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }

    const summaryWidgetContainer = document.getElementById('posLiveSummaryWidgetContainer');
    if (summaryWidgetContainer) {
        summaryWidgetContainer.innerHTML = `
            <div class="card bg-opacity-10 bg-dark border-secondary my-3 text-white">
                <div class="card-body p-3 font-monospace small">
                    <h6 class="fw-bold border-bottom border-secondary pb-2 text-warning text-uppercase"><i class="bi bi-shield-check"></i> Cashier Verification Summary</h6>
                    <div class="d-flex justify-content-between mb-1"><span>Treatment Amount:</span><span class="text-white">රු. ${totalTreatmentAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between mb-1"><span>VAS Amount:</span><span class="text-white">රු. ${totalVasAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between mb-1 text-danger"><span>Discount Deducted:</span><span>- රු. ${totalDiscountAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between mb-2 text-info border-bottom border-secondary pb-2"><span>Commission Amount (Hidden on Guest Receipt):</span><span>රු. ${totalCommissionAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between pt-1 fw-bold text-success fs-5"><span>FULL AMOUNT (NET):</span><span>රු. ${finalFullAmountNet.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                </div>
            </div>
        `;
    }
}

/**
 * 🛠️ AUTOMATED DROPDOWN INJECTOR NODE
 */
function safelyForcePopulatePOSDropdownFields() {
    console.log("📥 Forcing drop-down population loop from live memory caches...");

    // 1. Populate Target Rooms
    const roomSelect = document.getElementById('bulkIntakeRoomSelect');
    if (roomSelect && typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
        roomSelect.innerHTML = cacheRooms.map(r => {
            const num = r.fields['Room Number'] || 'N/A';
            const cap = r.fields['Beds Capacity'] || '1';
            return `<option value="${num}">Room ${num} (Capacity: ${cap} Beds)</option>`;
        }).join('');
    }

    // 2. Populate Registered Introducers
    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');
    if (introSelect && typeof cacheIntroducers !== 'undefined' && cacheIntroducers.length > 0) {
        introSelect.innerHTML = cacheIntroducers.map(i => {
            const name = i.fields['Full Name'] || 'Unknown Partner';
            return `<option value="${name}">${name}</option>`;
        }).join('');
    }
}

/**
 * ⚡ UNIVERSAL POS SUBMIT ENGINE
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    
    // Trigger A: Run automated load buffer right when the scripts complete parsing
    setTimeout(() => {
        safelyForcePopulatePOSDropdownFields();
        updateLiveIntakeSummaryDisplayLayer();
    }, 1500);

    if (bulkIntakeForm) {
        
        bulkIntakeForm.addEventListener('input', updateLiveIntakeSummaryDisplayLayer);
        bulkIntakeForm.addEventListener('change', updateLiveIntakeSummaryDisplayLayer);

        // Trigger B: Native Modal Bootstrap Interceptor Fallback Hook
        const modalElement = document.getElementById('bulkIntakeModal');
        if (modalElement) {
            modalElement.addEventListener('show.bs.modal', () => {
                safelyForcePopulatePOSDropdownFields();
                updateLiveIntakeSummaryDisplayLayer();
            });
        }

        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("🚀 Finalizing POS Transaction...");

            try {
                const selectedRoomFullText = document.getElementById('bulkIntakeRoomSelect').value;
                const parsedRoomClean = selectedRoomFullText.split(' ')[0].trim();
                let resolvedAirtableRoomId = "";
                
                if (typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    const matchedRoom = cacheRooms.find(r => String(r.fields['Room Number'] || '').trim() === parsedRoomClean);
                    if (matchedRoom) resolvedAirtableRoomId = matchedRoom.id; 
                }
                
                if (!resolvedAirtableRoomId && typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    resolvedAirtableRoomId = cacheRooms[0].id; 
                }

                const introducerType = document.getElementById('bulkIntakeIntroducerType').value;
                let resolvedIntroducerRecordId = null;
                let selectedIntroducerName = "Direct Walk-In";
                
                if (introducerType === 'Existing') {
                    selectedIntroducerName = document.getElementById('bulkIntakeIntroducerSelect').value;
                    if (typeof cacheIntroducers !== 'undefined' && cacheIntroducers.length > 0) {
                        const matchedIntroObj = cacheIntroducers.find(i => i.fields['Full Name'] === selectedIntroducerName);
                        if (matchedIntroObj) resolvedIntroducerRecordId = matchedIntroObj.id;
                    }
                }

                const commissionBasisType = document.getElementById('intakeCommType') ? document.getElementById('intakeCommType').value : 'LKR';
                const commissionInputAmount = document.getElementById('intakeCommValue') ? parseFloat(document.getElementById('intakeCommValue').value) || 0 : 0;
                const pathwayDropdownElement = document.getElementById('bulkSettlementMethod');
                const settlementMethodPathway = pathwayDropdownElement ? pathwayDropdownElement.value : 'Cash';

                const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row');
                let collectedReceiptItems = [];
                const savedBrandingLogoUrl = localStorage.getItem('SYSTEM_LOGO_URL') || "https://chanakaphd.github.io/IsiwaraAuraSystem/assets/logo.png";

                for (let row of containerRows) {
                    const nameField = row.querySelector('input[type="text"]');
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;
                    
                    const inputs = row.querySelectorAll('input[type="number"]');
                    const rawPackagePrice = inputs[0] ? parseFloat(inputs[0].value) || 0 : 0;
                    const manualVasFee = inputs[1] ? parseFloat(inputs[1].value) || 0 : 0;
                    const discountPercentage = inputs[2] ? parseFloat(inputs[2].value) || 0 : 0;
                    const chosenPackageName = row.querySelector('select') ? row.querySelector('select').value : "Ayurveda Service";
                    
                    const calculatedDiscountAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - calculatedDiscountAmount;
                    const grossCollectedTotal = netBaseRevenue + manualVasFee;

                    let guestProfileRecord = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!guestProfileRecord || !guestProfileRecord.id) continue;

                    let bookingEntryRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [guestProfileRecord.id],
                        "Room": [resolvedAirtableRoomId],
                        "Status": "Completed"
                    });

                    if (bookingEntryRecord && bookingEntryRecord.id) {
                        await dispatchPostRESTRequestHandshake('Financial Ledgers', {
                            "Booking Link": [bookingEntryRecord.id],
                            "Base Revenue": Number(netBaseRevenue) || 0,
                            "VAS Revenue": Number(manualVasFee) || 0,
                            "Settlement Type": settlementMethodPathway
                        });

                        collectedReceiptItems.push({
                            bookingId: bookingEntryRecord.fields['Booking ID'] || "BK-AURA",
                            guestName: guestNameStr,
                            service: chosenPackageName,
                            price: grossCollectedTotal
                        });

                        if (resolvedIntroducerRecordId) {
                            await dispatchPostRESTRequestHandshake('Commissions Ledger', {
                                "Booking Link": [bookingEntryRecord.id],
                                "Introducer Link": [resolvedIntroducerRecordId],
                                "Total Volume Base": Number(rawPackagePrice + manualVasFee) || 0,
                                "Commission Percentage": commissionBasisType === 'PCT' ? (parseInt(commissionInputAmount, 10) || 0) : 0,
                                "Payout Status": "Pending"
                            });
                        }
                    }
                }

                if (collectedReceiptItems.length > 0) {
                    const printWindow = window.open('', '_blank', 'width=340,height=650');
                    if (printWindow) {
                        printWindow.document.write(`
                            <html>
                            <body style="font-family:monospace; font-size:12px; padding:15px; color:#111;">
                                <div style="text-align:center; margin-bottom:12px;">
                                    <img src="${savedBrandingLogoUrl}" alt="Logo" style="max-width:100px; height:auto; margin-bottom:6px;"><br>
                                    <strong style="font-size:15px;">ISIWARA AURA</strong><br>
                                    <span style="font-size:10px; color:#444;">Boutique Heritage Wellness Center</span>
                                </div>
                                <hr style="border-top:1px dashed #000; margin-bottom:10px;">
                                <div style="margin-bottom:4px;"><strong>Date/Time:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                                <div style="margin-bottom:12px;"><strong>Settlement Channel:</strong> ${settlementMethodPathway}</div>
                                <table style="width:100%; font-size:12px; border-collapse:collapse;">
                                    <tr style="border-bottom:1px solid #000; font-weight:bold;">
                                        <td style="padding-bottom:4px;">Description</td>
                                        <td style="text-align:right; padding-bottom:4px;">Amount</td>
                                    </tr>
                                    ${collectedReceiptItems.map(item => `
                                        <tr>
                                            <td style="padding:6px 0 2px 0;"><strong>${item.guestName}</strong><br><span style="color:#555; font-size:11px;">${item.service} (${item.bookingId})</span></td>
                                            <td style="text-align:right; font-weight:bold; vertical-align:bottom;">රු. ${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                                <hr style="border-top:1px dashed #000; margin-top:15px; margin-bottom:10px;">
                                <div style="text-align:center; font-size:10px; font-weight:bold; color:#1e4620;">✔ TRANSACTION COMPLETED</div>
                                <div style="text-align:center; font-size:9px; color:#555; margin-top:2px;">Thank you for visiting Isiwara Aura.</div>
                            </body>
                            </html>
                        `);
                        printWindow.document.close();
                        setTimeout(() => { printWindow.print(); }, 500);
                    }
                }

                const modalEl = document.getElementById('bulkIntakeModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
                
                bulkIntakeForm.reset();
                document.getElementById('posLiveSummaryWidgetContainer').innerHTML = "";
                await fetchAndRenderMasterScheduleView();

            } catch (executionError) {
                console.error("POS Exception caught:", executionError);
            }
        };
    }
});
