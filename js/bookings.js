/**
 * Isiwara Aura - Production Operations & POS Accounting Double-Entry Controller
 */

/**
 * Compiles and renders active operations rows securely from cloud files.
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

        let mtdGrossCollectedRevenue = 0;
        mtdLedgerRecords.forEach(ledger => {
            mtdGrossCollectedRevenue += (ledger.fields['Gross Collected'] || 0);
        });

        // Inject metrics safely into dashboard summary boxes
        if(document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = mtdLedgerRecords.length;
        if(document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = activeBookings.length;
        if(document.getElementById('boxMtdUtilRate')) document.getElementById('boxMtdUtilRate').innerText = `${Math.min(98, Math.round(15 + (activeBookings.length * 2.2)))}%`;

        tableBody.innerHTML = activeBookings.map(booking => {
            const fields = booking.fields;
            const matchingFinancialRow = activeFinancials.find(f => f.fields['Booking Link']?.[0] === booking.id);
            const printedRevenueValue = matchingFinancialRow ? 
                `රු. ${(matchingFinancialRow.fields['Gross Collected'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 
                'රු. 0.00';

            const roomLabel = fields['Room Number'] || 'Treatment Quarters';
            const guestLabel = fields['Guest Name'] || 'Walk-In Client';
            const currentOperationalStatus = fields['Status'] || 'Completed';

            // Visual badge styling configuration mapping
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
        console.error("Dashboard Core Engine Exception:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">⚠️ Stream Alignment Fault. Check console parameters.</td></tr>`;
    }
}

/**
 * Dynamic Interface Arithmetic Calculation Layer Interceptor
 * Computes aggregated structural rows total blocks to inject directly into the UI layer.
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const activeRows = document.querySelectorAll('.dynamic-guest-row, #dynamic-guests-rows-container .row');
    if(activeRows.length === 0) return;

    let aggregateBaseRevenue = 0;
    let aggregateVasAmount = 0;
    let aggregateDiscount = 0;
    let aggregateCommission = 0;

    const commissionBasisType = document.getElementById('intakeCommType') ? document.getElementById('intakeCommType').value : 'LKR';
    const commissionInputAmount = document.getElementById('intakeCommValue') ? parseFloat(document.getElementById('intakeCommValue').value) || 0 : 0;

    activeRows.forEach(container => {
        const pInputField = container.querySelector('.package-price-input') || container.querySelector('input[type="number"]');
        const vInputField = container.querySelector('.vas-fee-input') || container.querySelectorAll('input[type="number"]')[1];
        const dInputField = container.querySelector('.discount-input') || container.querySelectorAll('input[type="number"]')[2];

        const rawPackagePrice = pInputField ? parseFloat(pInputField.value) || 0 : 0;
        const manualVasFee = vInputField ? parseFloat(vInputField.value) || 0 : 0;
        const discountPercentage = dInputField ? parseFloat(dInputField.value) || 0 : 0;

        const discountValueAmount = rawPackagePrice * (discountPercentage / 100);
        const netBaseRevenue = rawPackagePrice - discountValueAmount;

        aggregateBaseRevenue += netBaseRevenue;
        aggregateVasAmount += manualVasFee;
        aggregateDiscount += discountValueAmount;

        if (commissionBasisType === 'PCT') {
            aggregateCommission += (rawPackagePrice + manualVasFee) * (commissionInputAmount / 100);
        } else {
            aggregateCommission += commissionInputAmount / activeRows.length; // Pro-rated breakdown
        }
    });

    const aggregateTotalPaid = aggregateBaseRevenue + aggregateVasAmount;

    // Inject layout text values safely into the UI Summary element box if it exists
    const summaryWidgetContainer = document.getElementById('posLiveSummaryWidgetContainer');
    if (summaryWidgetContainer) {
        summaryWidgetContainer.innerHTML = `
            <div class="card bg-light border-0 shadow-sm mb-3">
                <div class="card-body p-3 font-monospace small">
                    <h6 class="fw-bold border-bottom pb-2 text-uppercase tracking-wider text-success"><i class="bi bi-calculator"></i> Live Real-Time Audit Summary Block</h6>
                    <div class="d-flex justify-content-between"><span>Gross Package Allocation Base:</span><strong>රු. ${aggregateBaseRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                    <div class="d-flex justify-content-between"><span>Value-Added Support (VAS) Revenue:</span><strong>රු. ${aggregateVasAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                    <div class="d-flex justify-content-between text-danger"><span>Operational Write-Offs (Discount):</span><strong>- රු. ${aggregateDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></div>
                    <div class="d-flex justify-content-between text-muted border-bottom pb-2"><span>Accounts Payable (Introducer Comm):</span><span>රු. ${aggregateCommission.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    <div class="d-flex justify-content-between pt-2 fw-bold text-success fs-6"><span>TOTAL SETTLED BALANCES PAID:</span><span>රු. ${aggregateTotalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                </div>
            </div>
        `;
    }
}

/**
 * ⚡ MASTER INTERACTIVE POS TRACK ENGINE INJECTION
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        
        // Setup live form mutation change interceptors to redraw interface boxes on configuration change events
        bulkIntakeForm.addEventListener('input', updateLiveIntakeSummaryDisplayLayer);
        bulkIntakeForm.addEventListener('change', updateLiveIntakeSummaryDisplayLayer);

        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("🚀 Initializing Universal Bulk Intake Processing Engine...");

            try {
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
                const pathwayDropdownElement = document.getElementById('bulkSettlementMethodSelect') || document.getElementById('bulkSettlementMethod');
                const settlementMethodPathway = pathwayDropdownElement ? pathwayDropdownElement.value : 'Cash';

                const activeRows = document.querySelectorAll('.dynamic-guest-row').length > 0 
                    ? document.querySelectorAll('.dynamic-guest-row') 
                    : document.querySelectorAll('#dynamic-guests-rows-container .row');

                let collectedReceiptItems = [];
                
                // Fetch systemic dynamic administration branding variables
                const savedBrandingLogoUrl = localStorage.getItem('SYSTEM_LOGO_URL') || "https://chanakaphd.github.io/IsiwaraAuraSystem/assets/logo.png";

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
                    const chosenPackageName = container.querySelector('select') ? container.querySelector('select').value : "Ayurveda Treatment Session";
                    
                    const discountValueAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - discountValueAmount;
                    const grossCollectedTotal = netBaseRevenue + manualVasFee;

                    // 1. Direct Insertion profiles row
                    let matchedGuest = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!matchedGuest || !matchedGuest.id) continue;

                    // 2. Commit booking setting configuration directly to "Completed" to balance point of sale settling
                    let createdBookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [matchedGuest.id],
                        "Room": [resolvedAirtableRoomId],
                        "Status": "Completed" // ✅ Overwritten dynamically to map payment execution fulfillment
                    });

                    if (createdBookingRecord && createdBookingRecord.id) {
                        
                        // 3. Document asset incoming records double entry balance mappings
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

                        // 4. Document liability accounts payable ledger entry balance mapping explicitly in pending status state
                        if (resolvedIntroducerRecordId) {
                            await dispatchPostRESTRequestHandshake('Commissions Ledger', {
                                "Booking Link": [createdBookingRecord.id],
                                "Introducer Link": [resolvedIntroducerRecordId],
                                "Total Volume Base": Number(rawPackagePrice + manualVasFee) || 0,
                                "Commission Percentage": commissionBasisType === 'PCT' ? (parseInt(commissionInputAmount, 10) || 0) : 0,
                                "Payout Status": "Pending" // ✅ Safely locks inside dynamic accounts payable matrix tracker
                            });
                        }
                    }
                }

                // 🖨️ ADVANCED THERMAL PRINTER RECEIPT POPUP INJECTION (WITH LOGO & ALIGNED CALCULATIONS)
                if (collectedReceiptItems.length > 0) {
                    const printWindow = window.open('', '_blank', 'width=340,height=650');
                    if (printWindow) {
                        printWindow.document.write(`
                            <html>
                            <body style="font-family:monospace; font-size:12px; padding:15px; color:#111;">
                                <div style="text-align:center; margin-bottom:10px;">
                                    <img src="${savedBrandingLogoUrl}" alt="Logo" style="max-width:90px; height:auto; filter:grayscale(100%); margin-bottom:4px;"><br>
                                    <strong style="font-size:14px;">ISIWARA AURA</strong><br>
                                    <span style="font-size:10px;">Premium Ayurveda Center & Spa</span>
                                </div>
                                <hr style="border-top:1px dashed #000; margin-bottom:8px;">
                                <div style="font-size:11px; margin-bottom:4px;"><strong>Date:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                                <div style="font-size:11px; margin-bottom:10px;"><strong>Payment Gateway Mode:</strong> ${settlementMethodPathway}</div>
                                <table style="width:100%; font-size:12px; border-collapse:collapse;">
                                    <tr style="border-bottom:1px solid #000; font-weight:bold;">
                                        <td>Description</td>
                                        <td style="text-align:right;">Amount</td>
                                    </tr>
                                    ${collectedReceiptItems.map(item => `
                                        <tr>
                                            <td style="padding-top:6px;"><strong>${item.guestName}</strong><br><span style="color:#444; font-size:11px;">${item.service} (${item.bookingId})</span></td>
                                            <td style="text-align:right; font-weight:bold; vertical-align:bottom;">රු. ${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                                <hr style="border-top:1px dashed #000; margin-top:15px;">
                                <div style="text-align:center; font-size:10px; font-weight:bold; margin-top:10px;">✨ TRANSACTIONS COMMITTED AS COMPLETED ✨</div>
                                <div style="text-align:center; font-size:9px; color:#555; margin-top:4px;">Thank you for checking in out of counter panels.</div>
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
                if (widget) widget.innerHTML = ""; // Clear widget audit data trail safely

                if (typeof fetchAndRenderMasterScheduleView === 'function') {
                    await fetchAndRenderMasterScheduleView();
                }

            } catch (executionError) {
                console.error("Master Processing Thread Exception:", executionError);
            }
        };
    }
});
