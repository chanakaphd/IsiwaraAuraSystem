/**
 * Isiwara Aura - Advanced Production Operations & Modern POS Checkout Controller
 * Upgraded for sequential integrity, conditional tracking logic, and future touch-ready UI layouts.
 */

// Global App State Matrix
var cacheRooms = [];
var cacheIntroducers = [];

/**
 * 1. Synchronous Cloud Boot Handshake
 */
async function initializeGlobalCaches() {
    try {
        console.log("📡 Core Sync: Initializing cloud data tables...");
        const [roomsResponse, introducersResponse] = await Promise.all([
            fetchAirtableTableRecords('Rooms'),
            fetchAirtableTableRecords('Introducers')
        ]);
        
        cacheRooms = roomsResponse || [];
        cacheIntroducers = introducersResponse || [];
        console.log("✅ Core Sync Success:", { rooms: cacheRooms.length, introducers: cacheIntroducers.length });
    } catch (e) {
        console.error("❌ Core Sync Failed:", e);
    }
}

/**
 * 2. Smart Form Interactivity & Conditional Layout Layer
 */
function safelyForcePopulatePOSDropdownFields() {
    const roomSelect = document.getElementById('bulkIntakeRoomSelect');
    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');

    if (roomSelect && cacheRooms.length > 0) {
        roomSelect.innerHTML = cacheRooms.map(room => 
            `<option value="${room.id}">Treatment Room ${room.fields['Room Number'] || 'N/A'}</option>`
        ).join('');
    }

    if (introSelect) {
        let options = `<option value="Direct">Direct Walk-In (No Commission)</option>`;
        if (cacheIntroducers.length > 0) {
            options += cacheIntroducers.map(intro => 
                `<option value="${intro.id}">${intro.fields['Full Name'] || 'Unnamed Partner'}</option>`
            ).join('');
        }
        introSelect.innerHTML = options;
    }

    // Bind conditional UI visibility toggles
    if (introSelect) {
        introSelect.addEventListener('change', toggleConditionalCommissionFields);
        toggleConditionalCommissionFields(); // Execute initially
    }
}

/**
 * Toggles visibility of the Commission section depending on whether a real partner is chosen
 */
function toggleConditionalCommissionFields() {
    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');
    const commissionWrapper = document.getElementById('conditionalCommissionWrapper');
    
    if (!introSelect || !commissionWrapper) return;
    
    if (introSelect.value === 'Direct' || introSelect.value === '') {
        commissionWrapper.style.display = 'none'; // Clear from view for Direct Walk-ins
    } else {
        commissionWrapper.style.display = 'block'; // Make visible for active partners
        // Ensure sub-labels correspond to current measurement scales
        if (typeof toggleCommissionAddonLabel === 'function') toggleCommissionAddonLabel();
    }
    updateLiveIntakeSummaryDisplayLayer();
}

/**
 * 3. Reactive Accounting Summary Engine
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row, [id^="guest-row-"]');
    
    let totalTreatmentAmount = 0;
    let totalVasAmount = 0;
    let totalDiscountAmount = 0;
    let totalCommissionAmount = 0;

    // Gather inputs accurately across changing row formats
    containerRows.forEach(row => {
        const priceInput = row.querySelector('.package-price-input') || row.querySelectorAll('input[type="number"]')[0];
        const vasInput = row.querySelector('.vas-fee-input') || row.querySelectorAll('input[type="number"]')[1];
        const discInput = row.querySelector('.discount-input') || row.querySelectorAll('input[type="number"]')[2];

        const basePrice = parseFloat(priceInput?.value) || 0;
        const vasFee = parseFloat(vasInput?.value) || 0;
        const discountPercentage = parseFloat(discInput?.value) || 0;

        totalTreatmentAmount += basePrice;
        totalVasAmount += vasFee;
        totalDiscountAmount += (basePrice * (discountPercentage / 100));
    });

    // Check conditional tracking state for calculated allocations
    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');
    const isPartnerActive = introSelect && introSelect.value !== 'Direct' && introSelect.value !== '';
    
    if (isPartnerActive) {
        const commType = document.getElementById('intakeCommType')?.value || 'LKR';
        const commValueInput = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;

        if (commType === 'PCT') {
            // Rule: Commission Split Rate (%) calculation applies strictly to Base Treatment values
            totalCommissionAmount = totalTreatmentAmount * (commValueInput / 100);
        } else {
            // Flat absolute value allocation
            totalCommissionAmount = commValueInput;
        }
    }

    const netSettlementTotal = (totalTreatmentAmount - totalDiscountAmount) + totalVasAmount;
    const summaryBox = document.getElementById('posLiveSummaryWidgetContainer');
    
    if (summaryBox) {
        summaryBox.innerHTML = `
            <div class="card bg-dark border-secondary text-white p-3 shadow rounded-3 animate-fade-in">
                <div class="text-uppercase tracking-wider small text-muted mb-2 border-bottom border-secondary pb-1">Operational Receipt Matrix</div>
                <div class="d-flex justify-content-between my-1"><span>Treatment Treatments Base:</span> <span class="font-monospace fw-bold">රු. ${totalTreatmentAmount.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between my-1"><span>Value Added Services (VAS):</span> <span class="font-monospace">රු. ${totalVasAmount.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between my-1 text-danger"><span>Deductions / Discounts:</span> <span class="font-monospace">-රු. ${totalDiscountAmount.toFixed(2)}</span></div>
                ${isPartnerActive ? `
                <div class="d-flex justify-content-between my-1 text-info"><span>Calculated Commission Allocation:</span> <span class="font-monospace">රු. ${totalCommissionAmount.toFixed(2)}</span></div>
                ` : ''}
                <div class="border-top border-secondary mt-2 pt-2 d-flex justify-content-between align-items-center">
                    <span class="text-success fw-bold">NET TOTAL DUE:</span>
                    <span class="fs-4 fw-bold text-success font-monospace">රු. ${netSettlementTotal.toFixed(2)}</span>
                </div>
            </div>`;
    }
}

/**
 * 4. Micro-Execution Orchestrator Lifecycle
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Stage A: Load data records completely before parsing the UI view model
    await initializeGlobalCaches();
    safelyForcePopulatePOSDropdownFields();
    updateLiveIntakeSummaryDisplayLayer();

    // Stage B: Event Subscriptions setup
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        bulkIntakeForm.addEventListener('input', updateLiveIntakeSummaryDisplayLayer);
        bulkIntakeForm.addEventListener('change', updateLiveIntakeSummaryDisplayLayer);

        // Core Transaction Lodgment Pipeline
        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("🚀 Initializing checkout pipeline transaction loop...");

            try {
                const targetRoomRecordId = document.getElementById('bulkIntakeRoomSelect')?.value;
                const targetIntroducerRecordId = document.getElementById('bulkIntakeIntroducerSelect')?.value;
                const settlementMethodPathway = document.getElementById('bulkSettlementMethod')?.value || 'Cash';

                if (!targetRoomRecordId) {
                    throw new Error("Validation Guard: Missing target physical treatment room registration.");
                }

                const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row, [id^="guest-row-"]');
                if (containerRows.length === 0) throw new Error("Transaction cancelled: No active guest entries recorded.");

                for (let row of containerRows) {
                    const nameField = row.querySelector('input[type="text"]');
                    const guestNameStr = nameField ? nameField.value.trim() : "";
                    if (!guestNameStr) continue;

                    // Numeric values extraction
                    const inputs = row.querySelectorAll('input[type="number"]');
                    const rawPackagePrice = inputs[0] ? parseFloat(inputs[0].value) || 0 : 0;
                    const manualVasFee = inputs[1] ? parseFloat(inputs[1].value) || 0 : 0;
                    const discountPercentage = inputs[2] ? parseFloat(inputs[2].value) || 0 : 0;

                    const calculatedDiscountAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - calculatedDiscountAmount;

                    // Execution Step 1: Create Guest Profile Node
                    let guestRecord = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!guestRecord || !guestRecord.id) throw new Error(`Host rejected unique profile creation for: ${guestNameStr}`);

                    // Execution Step 2: Establish Booking Registry Node
                    let bookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [guestRecord.id],
                        "Room": [targetRoomRecordId],
                        "Status": "Completed"
                    });
                    if (!bookingRecord || !bookingRecord.id) throw new Error("Operational pipeline failure establishing tracking Booking reference.");

                    // Execution Step 3: Populate and Post Double-Entry Financial Ledger
                    const financialPayload = {
                        "Booking Link": [bookingRecord.id],
                        "Base Revenue": Number(netBaseRevenue) || 0,
                        "VAS Revenue": Number(manualVasFee) || 0,
                        "Settlement Type": settlementMethodPathway
                    };

                    console.log("Lodging transaction profile:", financialPayload);
                    const ledgerResult = await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);
                    if (!ledgerResult || ledgerResult.error) {
                        throw new Error(`Accounting Vault Rejection: ${ledgerResult ? ledgerResult.error.message : 'Unknown Fault'}`);
                    }

                    // Execution Step 4: Conditional Commission Ledger Allocation Node
                    if (targetIntroducerRecordId && targetIntroducerRecordId !== 'Direct') {
                        const commType = document.getElementById('intakeCommType')?.value || 'LKR';
                        const commValueInput = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;
                        
                        let assignedCommPct = 0;
                        if (commType === 'PCT') {
                            assignedCommPct = commValueInput;
                        }

                        const commissionPayload = {
                            "Booking Link": [bookingRecord.id],
                            "Introducer Link": [targetIntroducerRecordId],
                            "Total Volume Base": Number(rawPackagePrice + manualVasFee) || 0,
                            "Commission Percentage": Number(assignedCommPct),
                            "Payout Status": "Pending"
                        };

                        console.log("Lodging agency payload:", commissionPayload);
                        await dispatchPostRESTRequestHandshake('Commissions Ledger', commissionPayload);
                    }
                }

                alert("🟢 POS Transaction Securely Transmitted & Recorded to Cloud Ledgers.");
                location.reload();

            } catch (pipelineFault) {
                console.error("❌ Critical Pipeline Halt:", pipelineFault);
                alert("POS Execution Aborted:\n" + pipelineFault.message);
            }
        };
    }
});

/**
 * 5. Utility Layout Switchers
 */
function toggleCommissionAddonLabel() {
    const typeSelect = document.getElementById('intakeCommType');
    const label = document.getElementById('lblCommValue');
    if (!typeSelect || !label) return;
    
    label.innerText = typeSelect.value === 'LKR' 
        ? 'Commission Value Allocation (රු.)' 
        : 'Commission Percentage Split Rate (%)';
}
