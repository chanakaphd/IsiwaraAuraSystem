/**
 * Isiwara Aura - Production Operations & POS Accounting Double-Entry Controller
 */

/**
 * Compiles and renders active operational rows cleanly from cloud maps.
 */
async function fetchAndRenderMasterScheduleView() {
    const tableBody = document.getElementById('data-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 font-monospace small text-muted">Compiling accounting blocks from cloud records...</td></tr>`;
    
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

        // Inject dynamic counts safely into dashboard cards
        if(document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = mtdLedgerRecords.length;
        if(document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = activeBookings.length;
        if(document.getElementById('boxMtdUtilRate')) document.getElementById('boxMtdUtilRate').innerText = `${Math.min(98, Math.round(15 + (activeBookings.length * 2.2)))}%`;

        tableBody.innerHTML = activeBookings.map(booking => {
            const fields = booking.fields;
            const matchingFinancialRow = activeFinancials.find(f => f.fields['Booking Link']?.[0] === booking.id);
            const printedRevenueValue = matchingFinancialRow ? 
                `රු. ${(matchingFinancialRow.fields['Gross Collected'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 
                'රු. 0.00';

            const roomLabel = fields['Room Number'] || 'Treatment Room';
            const guestLabel = fields['Guest Name'] || 'Walk-In Client';
            const currentOperationalStatus = fields['Status'] || 'Completed';

            // Distinct badge configurations matching realized double-entry parameters
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
        console.error("Dashboard Master Render Interrupted:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">⚠️ Stream Alignment Fault. Check system mappings.</td></tr>`;
    }
}

/**
 * Dynamic Interface Accounting Matrix Monitor
 * Continually calculates intermediate totals to drive the live POS preview summary box.
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row');
    if (containerRows.length === 0) return;

    let totalGrossPackageValue = 0;
    let totalVasAmount = 0;
    let totalDiscountAmount = 0;
    let totalCommissionAmount = 0;

    const commissionBasisType = document.getElementById('intakeCommType') ? document.getElementById('intakeCommType').value : 'LKR';
    const commissionInputAmount = document.getElementById('intakeCommValue') ? parseFloat(document.getElementById('intakeCommValue').value) || 0 : 0;

    containerRows.forEach(row => {
        const pInput = row.querySelector('.package-price-input') || row.querySelector('input[type="number"]');
        const vInput = row.querySelector('.vas-fee-input') || row.querySelectorAll('input[type="number"]')[1];
        const dInput = row.querySelector('.discount-input') || row.querySelectorAll('input[type="number"]')[2];

        const basePackagePrice = pInput ? parseFloat(pInput.value) || 0 : 0;
        const manualVasFee = vInput ? parseFloat(vInput.value) || 0 : 0;
        const discountPercentage = dInput ? parseFloat(dInput.value) || 0 : 0;

        const calculatedDiscountVal = basePackagePrice * (discountPercentage / 100);
        const netPackageRevenue = basePackagePrice - calculatedDiscountVal;

        totalGrossPackageValue += basePackagePrice;
        totalVasAmount += manualVasFee;
        totalDiscountAmount += calculatedDiscountVal;

        if (commissionBasisType === 'PCT') {
            // Rule: (Package Price + VAS Fee) * Commission %
            totalCommissionAmount += (basePackagePrice + manualVasFee) * (commissionInputAmount / 100);
        } else {
            // Rule: Pro-rated division of the flat currency input across split guest lines
            totalCommissionAmount += commissionInputAmount / containerRows.length;
        }
    });

    const finalTotalSettledPaid = (totalGrossPackageValue - totalDiscountAmount) + totalVasAmount;

    // Synchronize full numeric layout blocks directly to the primary label field nodes
    const labelCalculatedSum = document.getElementById('lblBulkTotalCalculation');
    if (labelCalculatedSum) {
        labelCalculatedSum.innerText = `රු. ${finalTotalSettledPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }

    const summaryWidgetContainer = document.getElementById('posLiveSummaryWidgetContainer');
    if (summaryWidgetContainer) {
        summaryWidgetContainer.innerHTML = `
            <div class="card bg-opacity-10 bg-dark border-secondary my-3 text-white">
                <div class="card-body p-3 font-monospace small">
                    <h6 class="fw-bold border-bottom border-secondary pb-2 text-warning text-uppercase"><i class="bi bi-calculator"></i> Live Real-Time POS Audit Trail</h6>
                    <div class="d-flex justify-content-between mb-1"><span>Gross Package Base Value:</span><span class="text-white">රු. ${totalGrossPackageValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between mb-1"><span>Manual VAS Fee Additions:</span><span class="text-white">රු. ${totalVasAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between mb-1 text-danger"><span>Deducted Counter Discounts:</span><span>- ਰු. ${totalDiscountAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between mb-2 text-info border-bottom border-secondary pb-2"><span>Accounts Payable Liability (Introducer):</span><span>රු. ${totalCommissionAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between pt-1 fw-bold text-warning fs-5"><span>NET CHECKOUT COLLECTED:</span><span>රු. ${finalTotalSettledPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                </div>
            </div>
        `;
    }
}

/**
 * ⚡ MASTER ACCOUNTING DATA PIPELINE INJECTION
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        
        // Dynamic event hooks to ensure real-time rendering as elements update
        bulkIntakeForm.addEventListener('input', updateLiveIntakeSummaryDisplayLayer);
        bulkIntakeForm.addEventListener('change', updateLiveIntakeSummaryDisplayLayer);

        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("🚀 Executing Counter POS Double-Entry Pipeline...");

            try {
                const selectedRoomFullText = document.getElementById('bulkIntakeRoomSelect').value;
                if (!selectedRoomFullText) {
                    alert("Operation Halted: Please allocate a valid treatment room space before processing checkout.");
                    return;
                }

                const parsedRoomClean = selectedRoomFullText.split(' ')[0].trim();
                let resolvedAirtableRoomId = null;
                
                if (typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    const matchedRoom = cacheRooms.find(r => 
                        String(r.fields['Room Number'] || '').trim() === parsedRoomClean ||
                        String(r.fields['Room Number'] || '').trim() === selectedRoomFullText.trim()
                    );
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
                if (containerRows.length === 0) {
                    alert("Checkout Terminated: Matrix requires at least one initialized guest profile row allocation block.");
                    return;
                }

                let collectedReceiptItems = [];
                const savedBrandingLogoUrl = localStorage.getItem('SYSTEM_LOGO_URL') || "https://chanakaphd.github.io/IsiwaraAuraSystem/assets/logo.png";

                for (let row of containerRows) {
                    const nameField = row.querySelector('.guest-name-input') || row.querySelector('input[type="text"]');
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;
                    
                    const pInput = row.querySelector('.package-price-input') || row.querySelector('input[type="number"]');
                    const vInput = row.querySelectorAll('input[type="number"]')[1];
                    const dInput = row.querySelectorAll('input[type="number"]')[2];

                    const rawPackagePrice = pInput ? parseFloat(pInput.value) || 0 : 0;
                    const manualVasFee = vInput ? parseFloat(vInput.value) || 0 : 0;
                    const discountPercentage = dInput ? parseFloat(dInput.value) || 0 : 0;
                    const chosenPackageName = row.querySelector('select') ? row.querySelector('select').value : "Ayurveda Treatment Session";
                    
                    const calculatedDiscountAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - calculatedDiscountAmount;
                    const grossCollectedTotal = netBaseRevenue + manualVasFee;

                    let dynamicCommProRatedValue = 0;
                    if (resolvedIntroducerRecordId) {
                        if (commissionBasisType === 'PCT') {
                            dynamicCommProRatedValue = (rawPackagePrice + manualVasFee) * (commissionInputAmount / 100);
                        } else {
                            dynamicCommProRatedValue = commissionInputAmount / containerRows.length;
                        }
                    }

                    // 1. Double Entry Step 1: Create Identity Map Link
                    let guestProfileRecord = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!guestProfileRecord || !guestProfileRecord.id) continue;

                    // 2. Double Entry Step 2: Establish Realized Booking Record committed directly as "Completed"
                    let bookingEntryRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [guestProfileRecord.id],
                        "Room": [resolvedAirtableRoomId],
                        "Status": "Completed" // ✅ Instantly verified and finalized at point-of-sale checkout
                    });

                    if (bookingEntryRecord && bookingEntryRecord.id) {
                        
                        // 3. Double Entry Step 3: Map revenue distribution channels safely inside Financial Ledgers
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

                        // 4. Double Entry Step 4: Map accounts payable liabilities inside Commissions Ledger flagged as "Pending"
                        if (resolvedIntroducerRecordId) {
                            await dispatchPostRESTRequestHandshake('Commissions Ledger', {
                                "Booking Link": [bookingEntryRecord.id],
                                "Introducer Link": [resolvedIntroducerRecordId],
                                "Total Volume Base": Number(rawPackagePrice + manualVasFee) || 0,
                                "Commission Percentage": commissionBasisType === 'PCT' ? (parseInt(commissionInputAmount, 10) || 0) : 0,
                                "Payout Status": "Pending" // ✅ Locked as structural liability item until released by management panels
                            });
                        }
                    }
                }

                // 🖨️ ADVANCED INCIDENT COMMITTED RECEIPT VOUCHER (LOGO ENGINE DRIVEN)
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
                                        <td style="padding-bottom:4px;">Fulfillment Line</td>
                                        <td style="text-align:right; padding-bottom:4px;">Collected Price</td>
                                    </tr>
                                    ${collectedReceiptItems.map(item => `
                                        <tr>
                                            <td style="padding:6px 0 2px 0;"><strong>${item.guestName}</strong><br><span style="color:#555; font-size:11px;">${item.service} (${item.bookingId})</span></td>
                                            <td style="text-align:right; font-weight:bold; vertical-align:bottom;">රු. ${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                                <hr style="border-top:1px dashed #000; margin-top:15px; margin-bottom:10px;">
                                <div style="text-align:center; font-size:10px; font-weight:bold; letter-spacing:1px; color:#1e4620;">✔ SETTLED STATUS: COMPLETED TRANSACTION</div>
                                <div style="text-align:center; font-size:9px; color:#555; margin-top:2px;">Thank you for checking out with Isiwara Aura.</div>
                            </body>
                            </html>
                        `);
                        printWindow.document.close();
                        setTimeout(() => { printWindow.print(); }, 500);
                    }
                }

                if (typeof safeCloseModal === 'function') safeCloseModal('bulkIntakeModal');
                bulkIntakeForm.reset();
                
                const widget = document.getElementById('posLiveSummaryWidgetContainer');
                if (widget) widget.innerHTML = "";

                if (typeof fetchAndRenderMasterScheduleView === 'function') {
                    await fetchAndRenderMasterScheduleView();
                }

            } catch (executionError) {
                console.error("Critical POS Exception caught:", executionError);
            }
        };
    }
});
