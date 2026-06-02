/**
 * Isiwara Aura - Production Operations & POS Engine Controller
 */

var cacheRooms = [];
var cacheIntroducers = [];

/**
 * 1. Synchronous Cloud Bootstrap Initialization
 */
async function initializeGlobalCaches() {
    try {
        console.log("📡 Core Sync: Fetching master structural table states...");
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
 * 2. Smart Form UI Population Layer
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
 * Spawns an interactive touch row for guest assignments dynamically
 */
function appendNewGuestAllocationRow() {
    const container = document.getElementById('dynamic-guests-rows-container');
    if (!container) return;

    const uniqueId = "guest-row-" + Date.now();
    const rowHTML = `
        <div class="row g-2 align-items-end dynamic-guest-row bg-black p-3 rounded-3 mb-2 border border-dark animate-fade-in" id="${uniqueId}">
            <div class="col-md-4">
                <input type="text" class="form-control bg-dark text-white border-secondary py-2" placeholder="Enter guest name..." required>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control bg-dark text-white border-secondary py-2 package-price-input" value="0" min="0" step="100">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control bg-dark text-white border-secondary py-2 vas-fee-input" value="0" min="0" step="100">
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control bg-dark text-white border-secondary py-2 discount-input" value="0" min="0" max="100">
            </div>
            <div class="col-md-2 text-end">
                <button type="button" onclick="document.getElementById('${uniqueId}').remove(); updateLiveIntakeSummaryDisplayLayer();" class="btn btn-outline-danger w-100 py-2 btn-sm text-uppercase fw-bold">
                    Drop Row
                </button>
            </div>
        </div>`;
    
    container.insertAdjacentHTML('beforeend', rowHTML);
    updateLiveIntakeSummaryDisplayLayer();
}

/**
 * 3. Reactive Accounting Summary UI Engine
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('.dynamic-guest-row');
    
    let totalTreatmentAmount = 0;
    let totalVasAmount = 0;
    let totalDiscountAmount = 0;
    let totalCommissionAmount = 0;

    containerRows.forEach(row => {
        const basePrice = parseFloat(row.querySelector('.package-price-input')?.value) || 0;
        const vasFee = parseFloat(row.querySelector('.vas-fee-input')?.value) || 0;
        const discountPercentage = parseFloat(row.querySelector('.discount-input')?.value) || 0;

        totalTreatmentAmount += basePrice;
        totalVasAmount += vasFee;
        totalDiscountAmount += (basePrice * (discountPercentage / 100));
    });

    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');
    const isPartnerActive = introSelect && introSelect.value !== 'Direct' && introSelect.value !== '';
    
    if (isPartnerActive) {
        const commType = document.getElementById('intakeCommType')?.value || 'LKR';
        const commValueInput = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;
        const grossVolumeBase = totalTreatmentAmount + totalVasAmount;

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
                <div class="d-flex justify-content-between my-1"><span>Total Treatment Price:</span> <span>රු. ${totalTreatmentAmount.toFixed(2)}</span></div>
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
 * 4. Form Lifecycle Form Pipeline
 */
document.addEventListener("DOMContentLoaded", async () => {
    await initializeGlobalCaches();
    appendNewGuestAllocationRow(); // Seed one row initially
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

                if (!targetRoomRecordId) throw new Error("Validation Error: Missing physical room assignment.");

                const containerRows = document.querySelectorAll('.dynamic-guest-row');
                if (containerRows.length === 0) throw new Error("Validation Error: No active guest entries generated.");

                for (let row of containerRows) {
                    const guestNameStr = row.querySelector('input[type="text"]')?.value.trim();
                    if (!guestNameStr) continue;

                    const rawPackagePrice = parseFloat(row.querySelector('.package-price-input')?.value) || 0;
                    const manualVasFee = parseFloat(row.querySelector('.vas-fee-input')?.value) || 0;
                    const discountPercentage = parseFloat(row.querySelector('.discount-input')?.value) || 0;

                    const calculatedDiscountAmount = rawPackagePrice * (discountPercentage / 100);
                    const calculatedBaseRevenue = rawPackagePrice - calculatedDiscountAmount;

                    // Write 1: Post Guest Record
                    let guestRecord = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!guestRecord || !guestRecord.id) throw new Error(`Server failed writing profile for ${guestNameStr}`);

                    // Write 2: Post Booking Record
                    let bookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [guestRecord.id],
                        "Room": [targetRoomRecordId],
                        "Status": "Completed"
                    });
                    if (!bookingRecord || !bookingRecord.id) throw new Error("Server failed generating core Booking node.");

                    // Write 3: Post Financial Record
                    const financialPayload = {
                        "Booking Link": [bookingRecord.id],
                        "Base Revenue": Number(calculatedBaseRevenue),
                        "VAS Revenue": Number(manualVasFee),
                        "Settlement Type": settlementMethodPathway
                    };
                    await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);

                    // Write 4: Post Commission Record
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

                alert("🟢 POS Transaction Securely Transmitted & Recorded.");
                location.reload();
            } catch (pipelineFault) {
                console.error("❌ POS Pipeline Interrupted:", pipelineFault);
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
