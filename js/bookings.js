/**
 * Isiwara Aura - Advanced Production Operations & Modern POS Checkout Controller
 * RELATIONAL MATRIX: Integrates automated Treatment Price lookups and Specialist Therapist mapping nodes.
 */

var cacheRooms = [];
var cacheIntroducers = [];
var cacheTreatments = [];
var cacheTherapists = [];

/**
 * 1. Synchronous Cloud Bootstrap Initialization (4-Table Pipeline Sync)
 */
async function initializeGlobalCaches() {
    try {
        console.log("📡 Core Sync: Fetching all relational structural schema states...");
        const [roomsRes, introducersRes, treatmentsRes, therapistsRes] = await Promise.all([
            fetchAirtableTableRecords('Rooms'),
            fetchAirtableTableRecords('Introducers'),
            fetchAirtableTableRecords('Treatments'),
            fetchAirtableTableRecords('Therapists')
        ]);
        
        cacheRooms = roomsRes || [];
        cacheIntroducers = introducersRes || [];
        cacheTreatments = treatmentsRes || [];
        cacheTherapists = therapistsRes || [];
        console.log("✅ Sync Complete. System memory populated cleanly.");
    } catch (e) {
        console.error("❌ Core Bootstrap Cache Handshake Failure:", e);
    }
}

/**
 * 2. Master Dropdown Populator Nodes
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
        introSelect.addEventListener('change', toggleConditionalCommissionFields);
        toggleConditionalCommissionFields(); 
    }
}

/**
 * Toggles visibility of the Commission module conditionally
 */
function toggleConditionalCommissionFields() {
    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');
    const commissionWrapper = document.getElementById('conditionalCommissionWrapper');
    
    if (!introSelect || !commissionWrapper) return;
    
    if (introSelect.value === 'Direct' || introSelect.value === '') {
        commissionWrapper.style.display = 'none';
    } else {
        commissionWrapper.style.display = 'block';
        toggleCommissionAddonLabel();
    }
    updateLiveIntakeSummaryDisplayLayer();
}

/**
 * 3. Dynamic Interactive Row Generator with Automated Relational Options Injection
 */
function appendNewGuestAllocationRow() {
    const container = document.getElementById('dynamic-guests-rows-container');
    if (!container) return;

    const uniqueId = "guest-row-" + Date.now();

    // Compile select dropdown parameters from cache states
    const treatmentOptionsHTML = cacheTreatments.map(t => 
        `<option value="${t.id}">${t.fields['Treatment Name']} (රු. ${(t.fields['Price'] || 0).toLocaleString()})</option>`
    ).join('');

    const therapistOptionsHTML = cacheTherapists.map(th => 
        `<option value="${th.id}">${th.fields['Full Name'] || th.fields['Name']}</option>`
    ).join('');

    const rowHTML = `
        <div class="row g-2 align-items-end dynamic-guest-row bg-black p-3 rounded-3 mb-2 border border-dark animate-fade-in" id="${uniqueId}">
            <!-- 1. Guest Profile Name -->
            <div class="col-md-3">
                <input type="text" class="form-control bg-dark text-white border-secondary py-2 guest-name-input" placeholder="Guest name..." required>
            </div>
            
            <!-- 2. Relational Treatment Dropdown Selector -->
            <div class="col-md-3">
                <select class="form-select bg-dark text-white border-secondary py-2 treatment-select-input" required>
                    <option value="">-- Choose Treatment --</option>
                    ${treatmentOptionsHTML}
                </select>
            </div>
            
            <!-- 3. Relational Therapist Dropdown Selector -->
            <div class="col-md-2">
                <select class="form-select bg-dark text-white border-secondary py-2 therapist-select-input" required>
                    <option value="">-- Assign Staff --</option>
                    ${therapistOptionsHTML}
                </select>
            </div>
            
            <!-- 4. Value Added Services Amount Entry -->
            <div class="col-md-2">
                <input type="number" class="form-control bg-dark text-white border-secondary py-2 vas-fee-input" value="0" min="0" step="100">
            </div>
            
            <!-- 5. Discount Percentage Value -->
            <div class="col-md-1">
                <input type="number" class="form-control bg-dark text-white border-secondary py-2 discount-input" value="0" min="0" max="100">
            </div>
            
            <!-- 6. Drop Active Segment Node Action -->
            <div class="col-md-1 text-end">
                <button type="button" onclick="document.getElementById('${uniqueId}').remove(); updateLiveIntakeSummaryDisplayLayer();" class="btn btn-outline-danger w-100 py-2 btn-sm text-uppercase fw-bold">
                    🗑️
                </button>
            </div>
        </div>`;
    
    container.insertAdjacentHTML('beforeend', rowHTML);
    
    // Bind real-time change calculation listeners directly to new dropdown entries
    const newRow = document.getElementById(uniqueId);
    newRow.querySelector('.treatment-select-input').addEventListener('change', updateLiveIntakeSummaryDisplayLayer);
    
    updateLiveIntakeSummaryDisplayLayer();
}

/**
 * 4. Reactive Accounting Summary Core (Pulls price from Treatment Cache)
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('.dynamic-guest-row');
    
    let totalTreatmentAmount = 0;
    let totalVasAmount = 0;
    let totalDiscountAmount = 0;
    let totalCommissionAmount = 0;

    containerRows.forEach(row => {
        const selectedTreatmentId = row.querySelector('.treatment-select-input')?.value;
        const vasFee = parseFloat(row.querySelector('.vas-fee-input')?.value) || 0;
        const discountPercentage = parseFloat(row.querySelector('.discount-input')?.value) || 0;

        // AUTOMATED LOOKUP TRICK: Match the chosen treatment id against the records cache
        const matchedTreatment = cacheTreatments.find(t => t.id === selectedTreatmentId);
        const basePrice = matchedTreatment ? (parseFloat(matchedTreatment.fields['Price']) || 0) : 0;

        totalTreatmentAmount += basePrice;
        totalVasAmount += vasFee;
        totalDiscountAmount += (basePrice * (discountPercentage / 100));
    });

    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');
    const isPartnerActive = introSelect && introSelect.value !== 'Direct' && introSelect.value !== '';
    
    if (isPartnerActive) {
        const commType = document.getElementById('intakeCommType')?.value || 'LKR';
        const commValueInput = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;
        const grossVolumeBase = totalTreatmentAmount + totalVasAmount; // Fixed calculation alignment node

        if (commType === 'PCT') {
            totalCommissionAmount = grossVolumeBase * (commValueInput / 100);
        } else {
            totalCommissionAmount = commValueInput;
        }
    }

    const netSettlementTotal = (totalTreatmentAmount - totalDiscountAmount) + totalVasAmount;
    const houseNetProfitRevenue = netSettlementTotal - totalCommissionAmount;

    const summaryBox = document.getElementById('posLiveSummaryWidgetContainer');
    if (summaryBox) {
        summaryBox.innerHTML = `
            <div class="card bg-dark border-secondary text-white p-3 shadow rounded-3">
                <div class="text-uppercase tracking-wider small text-muted mb-2 border-bottom border-secondary pb-1">Live POS Register Monitor</div>
                <div class="d-flex justify-content-between my-1"><span>Total Treatment Price:</span> <span class="fw-bold text-success">රු. ${totalTreatmentAmount.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between my-1"><span>Value Added Services (VAS):</span> <span>රු. ${totalVasAmount.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between my-1 text-danger"><span>Discounts Subtracted:</span> <span>-රු. ${totalDiscountAmount.toFixed(2)}</span></div>
                ${isPartnerActive ? `<div class="d-flex justify-content-between my-1 text-info"><span>Partner Commission Outflow:</span> <span>රු. ${totalCommissionAmount.toFixed(2)}</span></div>` : ''}
                <hr class="border-secondary">
                <div class="d-flex justify-content-between align-items-center my-1 text-success fw-bold">
                    <span>GROSS CASH COLLECTED:</span>
                    <span class="fs-5 font-monospace">රු. ${netSettlementTotal.toFixed(2)}</span>
                </div>
                <div class="border-top border-secondary mt-2 pt-2 d-flex justify-content-between align-items-center text-primary fw-bold">
                    <span>ESTIMATED HOUSE NET REVENUE:</span>
                    <span class="fs-4 font-monospace">රු. ${houseNetProfitRevenue.toFixed(2)}</span>
                </div>
            </div>`;
    }
}

/**
 * 5. Transaction Relational Lodgment Pipeline Execution Loop
 */
document.addEventListener("DOMContentLoaded", async () => {
    await initializeGlobalCaches();
    appendNewGuestAllocationRow(); // Seed one standard row
    safelyForcePopulatePOSDropdownFields();

    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        bulkIntakeForm.addEventListener('input', updateLiveIntakeSummaryDisplayLayer);
        bulkIntakeForm.addEventListener('change', updateLiveIntakeSummaryDisplayLayer);

        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const targetRoomRecordId = document.getElementById('bulkIntakeRoomSelect')?.value;
                const targetIntroducerRecordId = document.getElementById('bulkIntakeIntroducerSelect')?.value;
                const settlementMethodPathway = document.getElementById('bulkSettlementMethod')?.value || 'Cash';

                if (!targetRoomRecordId) throw new Error("Validation Error: Missing target physical room field selection.");

                const containerRows = document.querySelectorAll('.dynamic-guest-row');
                if (containerRows.length === 0) throw new Error("Validation Error: No active operational guest instances recorded.");

                for (let row of containerRows) {
                    const guestNameStr = row.querySelector('.guest-name-input')?.value.trim();
                    const selectedTreatmentId = row.querySelector('.treatment-select-input')?.value;
                    const selectedTherapistId = row.querySelector('.therapist-select-input')?.value;
                    
                    if (!guestNameStr || !selectedTreatmentId || !selectedTherapistId) {
                        throw new Error("Validation Error: Ensure Guest Name, Treatment, and Therapist fields are fully assigned per row.");
                    }

                    const manualVasFee = parseFloat(row.querySelector('.vas-fee-input')?.value) || 0;
                    const discountPercentage = parseFloat(row.querySelector('.discount-input')?.value) || 0;

                    // Fetch base price configuration from cached structure row reference
                    const matchedTreatment = cacheTreatments.find(t => t.id === selectedTreatmentId);
                    const rawPackagePrice = matchedTreatment ? (parseFloat(matchedTreatment.fields['Price']) || 0) : 0;

                    const calculatedDiscountAmount = rawPackagePrice * (discountPercentage / 100);
                    const calculatedBaseRevenue = rawPackagePrice - calculatedDiscountAmount;

                    // Write Step A: Post Unique Profile to Guests Table
                    let guestRecord = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!guestRecord || !guestRecord.id) throw new Error(`Server aborted transaction writing profile for: ${guestNameStr}`);

                    // Write Step B: Post Booking Record explicitly linking the chosen Treatment and Therapist IDs
                    let bookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [guestRecord.id],
                        "Room": [targetRoomRecordId],
                        "Treatment": [selectedTreatmentId],  // Injected Relational Field
                        "Therapist": [selectedTherapistId],  // Injected Relational Field
                        "Status": "Completed"
                    });
                    if (!bookingRecord || !bookingRecord.id) throw new Error("Server aborted operational transaction generating core Booking tracking index.");

                    // Write Step C: Post Balanced Double-Entry Payload to Financial Ledger
                    const financialPayload = {
                        "Booking Link": [bookingRecord.id],
                        "Base Revenue": Number(calculatedBaseRevenue),
                        "VAS Revenue": Number(manualVasFee),
                        "Settlement Type": settlementMethodPathway
                    };
                    await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);

                    // Write Step D: Post Commission Ledger Entry conditionally
                    if (targetIntroducerRecordId && targetIntroducerRecordId !== 'Direct') {
                        const commissionPercentInput = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;
                        const totalVolumeBaseCalculation = rawPackagePrice + manualVasFee;

                        const commissionPayload = {
                            "Booking Link": [bookingRecord.id],
                            "Introducer Link": [targetIntroducerRecordId],
                            "Total Volume Base": Number(totalVolumeBaseCalculation),
                            "Commission Percentage": Number(commissionPercentInput / 100), 
                            "Payout Status": "Pending"
                        };
                        await dispatchPostRESTRequestHandshake('Commissions Ledger', commissionPayload);
                    }
                }

                alert("🟢 POS Transaction Successfully Logged and Linked Across Database Schema.");
                location.reload();
            } catch (pipelineFault) {
                console.error("Critical POS System Runtime Halt:", pipelineFault);
                alert("POS Execution Aborted:\n" + pipelineFault.message);
            }
        };
    }
});

function toggleCommissionAddonLabel() {
    const typeSelect = document.getElementById('intakeCommType');
    const label = document.getElementById('lblCommValue');
    if (!typeSelect || !label) return;
    label.innerText = typeSelect.value === 'LKR' ? 'Commission Value Allocation (රු.)' : 'Commission Percentage Split Rate (%)';
}
