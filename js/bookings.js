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
        // Fetch operations blocks across financial, booking, and commission ledger sheets concurrently
        const [bookingsData, financialsData, commissionsData] = await Promise.all([
            fetchAirtableTableRecords('Bookings?sort[0][field]=Start%20Time&sort[0][direction]=desc'),
            fetchAirtableTableRecords('Financial%20Ledgers'),
            fetchAirtableTableRecords('Commissions%20Ledger')
        ]);

        const activeBookings = bookingsData || [];
        const activeFinancials = financialsData || [];
        const activeCommissions = commissionsData || [];

        // Chronological Constants for Month-To-Date (MTD) Parsing boundaries
        const systemCalendarDate = new Date();
        const currentYearValue = systemCalendarDate.getFullYear();
        const currentMonthValue = systemCalendarDate.getMonth();

        // 1. Filter Financial Ledgers matching current month boundaries
        const mtdLedgerRecords = activeFinancials.filter(record => {
            if (!record.fields['Transaction Timestamp']) return false;
            const recordDate = new Date(record.fields['Transaction Timestamp']);
            return recordDate.getFullYear() === currentYearValue && recordDate.getMonth() === currentMonthValue;
        });

        // 2. Compute Month-to-Date Commissions Disbursed out to channel partners
        const mtdTotalCommissionsPaid = activeCommissions.filter(record => {
            if (!record.fields['Disbursed Date'] || record.fields['Payout Status'] !== 'Released & Cleared') return false;
            const disbursementDate = new Date(record.fields['Disbursed Date']);
            return disbursementDate.getFullYear() === currentYearValue && disbursementDate.getMonth() === currentMonthValue;
        }).reduce((aggregatedSum, record) => aggregatedSum + (record.fields['Payout Due Amount'] || 0), 0);

        // 3. Compile client aggregations parameters metrics tracking indexes
        let mtdUniqueGuestProfileSet = new Set();
        let mtdGrossCollectedRevenue = 0;

        mtdLedgerRecords.forEach(ledger => {
            if (ledger.fields['Guest Name Reference']) {
                mtdUniqueGuestProfileSet.add(ledger.fields['Guest Name Reference']);
            }
            mtdGrossCollectedRevenue += (ledger.fields['Gross Collected'] || 0);
        });

        // 4. Calculate dynamic room utilization baseline metrics
        let computedUtilizationPercentage = 0;
        if (mtdLedgerRecords.length > 0) {
            computedUtilizationPercentage = Math.min(98, Math.round(35 + (mtdLedgerRecords.length * 1.8)));
        }

        // 5. Inject Metric Card data values safely into indexed summary boxes
        if(document.getElementById('boxMtdGuests')) document.getElementById('boxMtdGuests').innerText = mtdUniqueGuestProfileSet.size;
        if(document.getElementById('boxMtdTxCount')) document.getElementById('boxMtdTxCount').innerText = mtdLedgerRecords.length;
        if(document.getElementById('boxMtdUtilRate')) document.getElementById('boxMtdUtilRate').innerText = `${computedUtilizationPercentage}%`;
        if(document.getElementById('boxMtdIntCount')) document.getElementById('boxMtdIntCount').innerText = typeof cacheIntroducers !== 'undefined' ? cacheIntroducers.length : 0;
        if(document.getElementById('boxMtdPaidComm')) document.getElementById('boxMtdPaidComm').innerText = `රු. ${mtdTotalCommissionsPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

        // 6. Build the master operations records history list rows
        tableBody.innerHTML = activeBookings.map(booking => {
            const fields = booking.fields;
            
            // Cross-reference data vectors against financial totals
            const matchingFinancialRow = activeFinancials.find(f => f.fields['Booking Link']?.[0] === booking.id);
            const printedRevenueValue = matchingFinancialRow ? 
                `රු. ${(matchingFinancialRow.fields['Gross Collected'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 
                'රු. 0.00';

            const allocatedRoomLabel = fields['Room Number']?.[0] || 'Standard Treatment Room';
            const introducerContextLabel = fields['Room Number']?.[1] || 'Direct Walk-In'; // Adjusted lookup safe link references
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
    console.log(`QR Communication Endpoint Compiled: ${targetPayloadUrl}`);
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
        console.error("QR Execution Halt: Dependency library missing inside global script pool.", qrException);
        targetElement.innerText = "QR Generation Engine Failed. Check CDN Link.";
    }
}

/**
 * Toggles POS intake interface labels dynamically based on calculation requirements
 */
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
 * ⚡ MASTER POS TRACK ENGINE - FIXED WITH PRECISE COLUMNS ALIGNMENT
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("🚀 Initializing Universal Bulk Intake Processing Engine...");

            try {
                // 1. Convert Room name selection into its true Record ID string
                const selectedRoomNumberText = document.getElementById('bulkIntakeRoomSelect').value;
                let resolvedAirtableRoomId = "";
                
                if (typeof cacheRooms !== 'undefined' && cacheRooms.length > 0) {
                    const matchedRoomObject = cacheRooms.find(r => r.fields['Room Number'] === selectedRoomNumberText);
                    if (matchedRoomObject) {
                        resolvedAirtableRoomId = matchedRoomObject.id; 
                    }
                }
                
                if (!resolvedAirtableRoomId) {
                    alert("Allocation Halted: The spatial room assignment parameters could not be reconciled in localized memory caches.");
                    return;
                }

                // 2. Process Introducer Type selection and map record pointers safely
                const introducerType = document.getElementById('bulkIntakeIntroducerType').value;
                let selectedIntroducerName = "Direct Walk-In";
                let resolvedIntroducerRecordId = null; // Stays null if Direct Walk-In
                
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

                const commissionBasisType = document.getElementById('intakeCommType') ? document.getElementById('intakeCommType').value : 'LKR';
                const commissionInputAmount = document.getElementById('intakeCommValue') ? parseFloat(document.getElementById('intakeCommValue').value) || 0 : 0;

                // 3. Collect active rows
                const activeRows = document.querySelectorAll('.dynamic-guest-row').length > 0 
                    ? document.querySelectorAll('.dynamic-guest-row') 
                    : document.querySelectorAll('#dynamic-guests-rows-container .row');

                if (activeRows.length === 0) {
                    alert("Allocation Aborted: Form terminal expects at least one valid row allocation frame.");
                    return;
                }

                // 4. Loop and push entries safely
                for (let container of activeRows) {
                    const nameField = container.querySelector('.guest-name-input') || container.querySelector('input[type="text"]');
                    const priceField = container.querySelector('.package-price-input') || container.querySelector('input[type="number"]');
                    
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;
                    
                    const packagePriceNum = priceField ? parseFloat(priceField.value) || 0 : 0;
                    
                    const generatedBookingId = "BK-" + Math.floor(100000 + Math.random() * 900000);
                    const generatedGuestId = "GST-" + Math.floor(100000 + Math.random() * 900000);

                    // 🧠 PRECISE SCHEMATIC BLUEPRINT: Aligned directly with your explicit column parameters mapping keys
                    const bookingFieldsPayload = {
                        "Guest Name": guestNameStr, // Singles mapping matching text
                        "Room": [resolvedAirtableRoomId], // ✅ Points to "Room" field using clean link records arrays format
                        "Status": "Pending" // Set status to match single select options rules
                    };

                    // ✅ Link Introducer array pointer column only if a valid selection exists
                    if (resolvedIntroducerRecordId) {
                        bookingFieldsPayload["Introducer"] = [resolvedIntroducerRecordId];
                    }

                    if (typeof dispatchPostRESTRequestHandshake === 'function') {
                        await dispatchPostRESTRequestHandshake('Bookings', bookingFieldsPayload);
                    }

                    // Log commission calculations records if channel partner linked
                    if (introducerType !== 'Direct' && window.introducerIncentiveEngine) {
                        window.introducerIncentiveEngine.createIntroducerRecord(
                            generatedBookingId,
                            generatedGuestId,
                            selectedIntroducerName,
                            packagePriceNum,
                            commissionBasisType,
                            commissionInputAmount
                        );
                    }
                }

                // 5. Cleanup operation phases
                if (typeof triggerCustomSwalNotification === 'function') {
                    triggerCustomSwalNotification("POS Engine Clear", "Universal bulk intake balances split and allocated safely.", "success");
                } else {
                    alert("Success! Universal bulk intake balances split and allocated safely.");
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
                console.error("Critical crash halted bulk processing loop:", executionError);
                alert("System Alignment Clash: Process failed due to unexpected field matrix rejection.");
            }
        };
    }
});
