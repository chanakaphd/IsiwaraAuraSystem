/**
 * Isiwara Aura - Production Operations & Modern POS Checkout Controller
 * Structured for absolute data-type parity and sequential touch-screen tracking.
 */

var cacheRooms = [];
var cacheIntroducers = [];

/**
 * Core Initialization: Grabs basic data pools from the server
 */
async function initializeGlobalCaches() {
    try {
        console.log("📡 Initializing infrastructure dropdown states...");
        const [roomsResponse, introducersResponse] = await Promise.all([
            fetchAirtableTableRecords('Rooms'),
            fetchAirtableTableRecords('Introducers')
        ]);
        cacheRooms = roomsResponse || [];
        cacheIntroducers = introducersResponse || [];
        console.log("✅ State successfully cached locally.");
    } catch (e) {
        console.error("❌ Infrastructure bootstrap cache failure:", e);
    }
}

/**
 * Injects operational tables records securely into your select element templates
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
 * Hides or displays the commission details inputs natively depending on context tracking
 */
function toggleConditionalCommissionFields() {
    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');
    const commissionWrapper = document.getElementById('conditionalCommissionWrapper');
    if (!introSelect || !commissionWrapper) return;
    
    if (introSelect.value === 'Direct' || introSelect.value === '') {
        commissionWrapper.style.display = 'none';
    } else {
        commissionWrapper.style.display = 'block';
        if (typeof toggleCommissionAddonLabel === 'function') toggleCommissionAddonLabel();
    }
    updateLiveIntakeSummaryDisplayLayer();
}

/**
 * Reactive Computation Engine: Draws receipt state tracking directly from physical UI fields
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row, [id^="guest-row-"]');
    
    let totalTreatmentAmount = 0;
    let totalVasAmount = 0;
    let totalDiscountAmount = 0;
    let totalCommissionAmount = 0;

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

    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');
    const isPartnerActive = introSelect && introSelect.value !== 'Direct' && introSelect.value !== '';
    
    if (isPartnerActive) {
        const commType = document.getElementById('intakeCommType')?.value || 'LKR';
        const commValueInput = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;
        const grossVolumeBase = totalTreatmentAmount + totalVasAmount; // Logic alignment

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
            <div class="card bg-dark border-secondary text-white p-3 shadow rounded-3 animate-fade-in">
                <div class="text-uppercase tracking-wider small text-muted mb-2 border-bottom border-secondary pb-1">Live Operational Receipt Model</div>
                <div class="d-flex justify-content-between my-1"><span>Total Treatment Price:</span> <span class="fw-bold">රු. ${totalTreatmentAmount.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between my-1"><span>Value Added Services (VAS):</span> <span>රු. ${totalVasAmount.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between my-1 text-danger"><span>Deductions / Discounts Applied:</span> <span>-රු. ${totalDiscountAmount.toFixed(2)}</span></div>
                ${isPartnerActive ? `<div class="d-flex justify-content-between my-1 text-info"><span>Calculated Commission Outflow:</span> <span>රු. ${totalCommissionAmount.toFixed(2)}</span></div>` : ''}
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
 * Event Lifecycle Binding Execution Bridge
 */
document.addEventListener("DOMContentLoaded", async () => {
    await initializeGlobalCaches();
    safelyForcePopulatePOSDropdownFields();
    updateLiveIntakeSummaryDisplayLayer();

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

                if (!targetRoomRecordId) throw new Error("Validation Error: No physical location room assignment registered.");

                const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row, [id^="guest-row-"]');
                if (containerRows.length === 0) throw new Error("Validation Error: No operational guest entries generated.");

                for (let row of containerRows) {
                    const nameField = row.querySelector('input[type="text"]');
                    const guestNameStr = nameField ? nameField.value.trim() : "";
                    if (!guestNameStr) continue;

                    const inputs = row.querySelectorAll('input[type="number"]');
                    const rawPackagePrice = inputs[0] ? parseFloat(inputs[0].value) || 0 : 0;
                    const manualVasFee = inputs[1] ? parseFloat(inputs[1].value) || 0 : 0;
                    const discountPercentage = inputs[2] ? parseFloat(inputs[2].value) || 0 : 0;

                    const calculatedDiscountAmount = rawPackagePrice * (discountPercentage / 100);
                    const calculatedBaseRevenue = rawPackagePrice - calculatedDiscountAmount;

                    // 1. Post Guest Profile Row
                    let guestRecord = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!guestRecord || !guestRecord.id) throw new Error(`Server execution halt writing profile for ${guestNameStr}`);

                    // 2. Post Booking Row
                    let bookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [guestRecord.id],
                        "Room": [targetRoomRecordId],
                        "Status": "Completed"
                    });
                    if (!bookingRecord || !bookingRecord.id) throw new Error("Server execution halt generating core Booking node.");

                    // 3. Post Financial Ledger Entry (Let Airtable calculate Gross Collected)
                    const financialPayload = {
                        "Booking Link": [bookingRecord.id],
                        "Base Revenue": Number(calculatedBaseRevenue),
                        "VAS Revenue": Number(manualVasFee),
                        "Settlement Type": settlementMethodPathway
                    };
                    const finResult = await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);
                    if (!finResult || finResult.error) throw new Error(`Financial Ledger rejection: ${finResult ? finResult.error.message : 'Unknown Fault'}`);

                    // 4. Conditional Post Commissions Ledger Entry (Let Airtable calculate Payout Due)
                    if (targetIntroducerRecordId && targetIntroducerRecordId !== 'Direct') {
                        const commissionPercentInput = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;
                        const totalVolumeBaseCalculation = rawPackagePrice + manualVasFee;

                        const commissionPayload = {
                            "Booking Link": [bookingRecord.id],
                            "Introducer Link": [targetIntroducerRecordId],
                            "Total Volume Base": Number(totalVolumeBaseCalculation),
                            "Commission Percentage": Number(commissionPercentInput / 100), // Converted cleanly to database float format (e.g., 0.15)
                            "Payout Status": "Pending"
                        };
                        const commResult = await dispatchPostRESTRequestHandshake('Commissions Ledger', commissionPayload);
                        if (!commResult || commResult.error) throw new Error(`Commissions Ledger rejection: ${commResult ? commResult.error.message : 'Unknown Fault'}`);
                    }
                }

                alert("🟢 Transaction Securely Processed & Lodged across Database Schema.");
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
