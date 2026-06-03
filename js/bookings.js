/**
 * js/bookings.js
 * Production Operations & Touch-POS Sub-allocations Checkout Controller Engine
 */

var cacheRooms = [];
var cacheIntroducers = [];
var cacheTreatments = [];
var cacheTherapists = [];

/**
 * Complete System Caches Loader Matrix
 */
async function initializeGlobalCaches() {
    try {
        console.log("📡 Core Cache: Syncing configuration data points matrix...");
        const [rooms, intro, treatments, therapists] = await Promise.all([
            fetchAirtableTableRecords('Rooms'),
            fetchAirtableTableRecords('Introducers'),
            fetchAirtableTableRecords('Treatments'),
            fetchAirtableTableRecords('Therapists')
        ]);
        
        cacheRooms = rooms || [];
        cacheIntroducers = intro || [];
        cacheTreatments = treatments || [];
        cacheTherapists = therapists || [];
        console.log("✅ Core Cache Success. State arrays locked.");
    } catch (cacheException) {
        console.error("❌ Fatal Core Cache Handshake Execution Dropped:", cacheException);
    }
}

/**
 * Static Field Selections Dropdown Array Binding Injection Interface Node
 */
function safelyForcePopulatePOSDropdownFields() {
    const roomSelectElement = document.getElementById('bulkIntakeRoomSelect');
    const introducerSelectElement = document.getElementById('bulkIntakeIntroducerSelect');

    if (roomSelectElement && cacheRooms.length > 0) {
        roomSelectElement.innerHTML = cacheRooms.map(room => 
            `<option value="${room.id}">Treatment Module Room ${room.fields['Room Number'] || 'N/A'}</option>`
        ).join('');
    }

    if (introducerSelectElement) {
        let foundationalFallbackOptions = `<option value="Direct">Direct Counter Walk-In (No Commission Allocation)</option>`;
        if (cacheIntroducers.length > 0) {
            foundationalFallbackOptions += cacheIntroducers.map(partner => 
                `<option value="${partner.id}">${partner.fields['Full Name'] || 'Active Broker Partner'}</option>`
            ).join('');
        }
        introducerSelectElement.innerHTML = foundationalFallbackOptions;
        introducerSelectElement.addEventListener('change', toggleConditionalCommissionFields);
        toggleConditionalCommissionFields();
    }
}

function toggleConditionalCommissionFields() {
    const selectNode = document.getElementById('bulkIntakeIntroducerSelect');
    const wrapperLayoutNode = document.getElementById('conditionalCommissionWrapper');
    if (!selectNode || !wrapperLayoutNode) return;
    
    if (selectNode.value === 'Direct' || selectNode.value === '') {
        wrapperLayoutNode.style.display = 'none';
    } else {
        wrapperLayoutNode.style.display = 'block';
        toggleCommissionAddonLabel();
    }
    updateLiveIntakeSummaryDisplayLayer();
}

/**
 * Touch Screen Action Component: Spawns an interactive row containing dynamic dropdown arrays
 */
function appendNewGuestAllocationRow() {
    const layoutTargetAnchor = document.getElementById('dynamic-guests-rows-container');
    if (!layoutTargetAnchor) return;

    const structuralRowUniqueId = "guest-row-uuid-" + Date.now();

    const treatmentMenuStringHTML = cacheTreatments.map(t => 
        `<option value="${t.id}">${t.fields['Treatment Name']} (රු. ${(t.fields['Price'] || 0).toLocaleString()})</option>`
    ).join('');

    const practitionersMenuStringHTML = cacheTherapists.map(th => 
        `<option value="${th.id}">${th.fields['Name'] || 'Specialist Therapist'}</option>`
    ).join('');

    const customRowStringTemplateHTML = `
        <div class="row g-2 align-items-end dynamic-guest-row bg-black p-3 rounded-3 mb-2 border border-dark animate-fade-in" id="${structuralRowUniqueId}">
            <div class="col-md-3">
                <input type="text" class="form-control bg-dark text-white border-secondary py-2 guest-name-input touch-control" placeholder="Guest name..." required>
            </div>
            <div class="col-md-3">
                <select class="form-select bg-dark text-white border-secondary py-2 treatment-select-input touch-control" required>
                    <option value="">-- Select Treatment --</option>
                    ${treatmentMenuStringHTML}
                </select>
            </div>
            <div class="col-md-2">
                <select class="form-select bg-dark text-white border-secondary py-2 therapist-select-input touch-control" required>
                    <option value="">-- Bind Staff --</option>
                    ${practitionersMenuStringHTML}
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control bg-dark text-white border-secondary py-2 vas-fee-input touch-control" value="0" min="0" step="100">
            </div>
            <div class="col-md-1">
                <input type="number" class="form-control bg-dark text-white border-secondary py-2 discount-input touch-control" value="0" min="0" max="100">
            </div>
            <div class="col-md-1 text-end">
                <button type="button" onclick="document.getElementById('${structuralRowUniqueId}').remove(); updateLiveIntakeSummaryDisplayLayer();" class="btn btn-outline-danger w-100 py-2 btn-sm fw-bold">🗑️</button>
            </div>
        </div>`;
    
    layoutTargetAnchor.insertAdjacentHTML('beforeend', customRowStringTemplateHTML);

    // Bind real-time computational monitoring triggers down into row change events
    const rowElementNode = document.getElementById(structuralRowUniqueId);
    rowElementNode.querySelector('.treatment-select-input').addEventListener('change', updateLiveIntakeSummaryDisplayLayer);
    rowElementNode.querySelector('.vas-fee-input').addEventListener('input', updateLiveIntakeSummaryDisplayLayer);
    rowElementNode.querySelector('.discount-input').addEventListener('input', updateLiveIntakeSummaryDisplayLayer);

    updateLiveIntakeSummaryDisplayLayer();
}

/**
 * Computational Accounting Node: Formats receipts calculations before pushing data fields
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const targetInspectionDataRows = document.querySelectorAll('.dynamic-guest-row');
    
    let cumulativeGrossTreatmentPrice = 0;
    let cumulativeVasValueUpcharges = 0;
    let cumulativeDiscountReductions = 0;
    let cumulativeIntroducerCommission = 0;

    targetInspectionDataRows.forEach(rowNode => {
        const itemTreatmentRecordId = rowNode.querySelector('.treatment-select-input')?.value;
        const valueAddedServicesFee = parseFloat(rowNode.querySelector('.vas-fee-input')?.value) || 0;
        const discountMarkdownPercentage = parseFloat(rowNode.querySelector('.discount-input')?.value) || 0;

        const alignedTreatmentObject = cacheTreatments.find(item => item.id === itemTreatmentRecordId);
        const underlyingBaseCostPrice = alignedTreatmentObject ? (parseFloat(alignedTreatmentObject.fields['Price']) || 0) : 0;

        cumulativeGrossTreatmentPrice += underlyingBaseCostPrice;
        cumulativeVasValueUpcharges += valueAddedServicesFee;
        cumulativeDiscountReductions += (underlyingBaseCostPrice * (discountMarkdownPercentage / 100));
    });

    const activeBrokerSelectNode = document.getElementById('bulkIntakeIntroducerSelect');
    const isAffiliateTrackActive = activeBrokerSelectNode && activeBrokerSelectNode.value !== 'Direct' && activeBrokerSelectNode.value !== '';
    
    if (isAffiliateTrackActive) {
        const structuralCalculationBasisRoute = document.getElementById('intakeCommType')?.value || 'LKR';
        const commissionEntryNumericalValue = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;
        
        // BR-001 Validation Rule: Split calculation targets global aggregate subtotal values before discounts markdown
        const totalVolumeBaseAuditMetrics = cumulativeGrossTreatmentPrice + cumulativeVasValueUpcharges;

        if (structuralCalculationBasisRoute === 'PCT') {
            cumulativeIntroducerCommission = totalVolumeBaseAuditMetrics * (commissionEntryNumericalValue / 100);
        } else {
            cumulativeIntroducerCommission = commissionEntryNumericalValue;
        }
    }

    const transactionGrandTotalDue = (cumulativeGrossTreatmentPrice - cumulativeDiscountReductions) + cumulativeVasValueUpcharges;
    const computedHouseNetRetainedRevenue = transactionGrandTotalDue - cumulativeIntroducerCommission;

    const summaryWidgetBoxNode = document.getElementById('posLiveSummaryWidgetContainer');
    if (summaryWidgetBoxNode) {
        summaryWidgetBoxNode.innerHTML = `
            <div class="card bg-gradient-dark border-secondary text-white p-3 shadow rounded-3 animate-fade-in">
                <div class="text-uppercase tracking-wider small text-muted mb-2 border-bottom border-secondary pb-1 fw-bold">Digital POS Ledger Verification Screen</div>
                <div class="d-flex justify-content-between my-1"><span>Gross Treatments Value:</span> <span class="font-monospace">රු. ${cumulativeGrossTreatmentPrice.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between my-1"><span>Value Added Services (VAS):</span> <span class="font-monospace">රු. ${cumulativeVasValueUpcharges.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between my-1 text-danger"><span>Deductions / Discounts:</span> <span class="font-monospace">-රු. ${cumulativeDiscountReductions.toFixed(2)}</span></div>
                ${isAffiliateTrackActive ? `<div class="d-flex justify-content-between my-1 text-info"><span>BR-009 Partner Commission Cut:</span> <span class="font-monospace">රු. ${cumulativeIntroducerCommission.toFixed(2)}</span></div>` : ''}
                <hr class="border-secondary my-2">
                <div class="d-flex justify-content-between align-items-center my-1 text-success fw-bold fs-6">
                    <span>GROSS COLLECTED (CASH REGISTER):</span>
                    <span class="font-monospace fs-5">රු. ${transactionGrandTotalDue.toFixed(2)}</span>
                </div>
                <div class="border-top border-secondary mt-2 pt-2 d-flex justify-content-between align-items-center text-primary fw-bold">
                    <span>ESTIMATED HOUSE NET PROFIT:</span>
                    <span class="font-monospace fs-4">රු. ${computedHouseNetRetainedRevenue.toFixed(2)}</span>
                </div>
            </div>`;
    }
}

/**
 * 5. Primary Orchestration Lifecycle Block: Processes form submissions
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Structural scrub to force drop old desktop DOM values prior to execution mapping
    const anchor = document.getElementById('dynamic-guests-rows-container');
    if(anchor) anchor.innerHTML = "";

    await initializeGlobalCaches();
    appendNewGuestAllocationRow(); // Seed initial operational entry item
    safelyForcePopulatePOSDropdownFields();

    const checkoutsFormEngineNode = document.getElementById('bulkIntakeForm');
    if (checkoutsFormEngineNode) {
        checkoutsFormEngineNode.onsubmit = async (event) => {
            event.preventDefault();
            console.log("🚀 Pipeline Dispatch: Launching checkout record generation...");

            try {
                const roomAirtableRecordId = document.getElementById('bulkIntakeRoomSelect')?.value;
                const introducerAirtableRecordId = document.getElementById('bulkIntakeIntroducerSelect')?.value;
                const explicitSettlementRouteMethod = document.getElementById('bulkSettlementMethod')?.value || 'Cash';

                if (!roomAirtableRecordId) throw new Error("Validation Guard: Missing physical target room location parameter.");

                const activeDataRowsCollection = document.querySelectorAll('.dynamic-guest-row');
                if (activeDataRowsCollection.length === 0) throw new Error("Validation Guard: Empty rows array canvas.");

                for (let activeRow of activeDataRowsCollection) {
                    const literalGuestNameString = activeRow.querySelector('.guest-name-input')?.value.trim();
                    const targetRowTreatmentId = activeRow.querySelector('.treatment-select-input')?.value;
                    const targetRowTherapistId = activeRow.querySelector('.therapist-select-input')?.value;

                    if (!literalGuestNameString || !targetRowTreatmentId || !targetRowTherapistId) {
                        throw new Error("Validation Guard: Missing fields assignments on active checkout paths elements.");
                    }

                    const specifiedRowVasFee = parseFloat(activeRow.querySelector('.vas-fee-input')?.value) || 0;
                    const specifiedRowDiscountPct = parseFloat(activeRow.querySelector('.discount-input')?.value) || 0;

                    const activeTreatmentCacheRecord = cacheTreatments.find(item => item.id === targetRowTreatmentId);
                    const underlyingBasePriceMetric = activeTreatmentCacheRecord ? (parseFloat(activeTreatmentCacheRecord.fields['Price']) || 0) : 0;

                    const calculatedDeductionsValue = underlyingBasePricePrice = underlyingBasePriceMetric * (specifiedRowDiscountPct / 100);
                    const finalTransmittedBaseRevenue = underlyingBasePriceMetric - calculatedDeductionsValue;
                    const ultimateRowGrossCollected = finalTransmittedBaseRevenue + specifiedRowVasFee;

                    // Write Step A: Write profile row to Guests table
                    let writtenGuestProfile = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": literalGuestNameString });
                    if (!writtenGuestProfile || !writtenGuestProfile.id) throw new Error("Cloud Abort: Guests schema profile creation dropped.");

                    // Write Step B: Write session tracking row to Bookings table
                    let writtenBookingRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [writtenGuestProfile.id],
                        "Room": [roomAirtableRecordId],
                        "Treatment": [targetRowTreatmentId],
                        "Therapist": [targetRowTherapistId],
                        "Status": "Completed",
                        "Payment Status": "Paid"
                    });
                    if (!writtenBookingRecord || !writtenBookingRecord.id) throw new Error("Cloud Abort: Bookings schema link tracking item creation dropped.");

                    // Write Step C: Post balanced entry rows to Financial Ledger
                    const financialPayloadData = {
                        "Booking Link": [writtenBookingRecord.id],
                        "Base Revenue": Number(finalTransmittedBaseRevenue),
                        "VAS Revenue": Number(specifiedRowVasFee),
                        "Gross Collected": Number(ultimateRowGrossCollected),
                        "Settlement Type": explicitSettlementRouteMethod
                    };
                    await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayloadData);

                    // Write Step D: Post conditional metrics rows to Commissions Ledger
                    if (introducerAirtableRecordId && introducerAirtableRecordId !== 'Direct') {
                        const commissionInputPercentageValue = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;
                        const calculationTotalVolumeBaseMetric = underlyingBasePriceMetric + specifiedRowVasFee; // BR-001 Calculation Alignment

                        const commissionPayloadData = {
                            "Booking Link": [writtenBookingRecord.id],
                            "Introducer Link": [introducerAirtableRecordId],
                            "Total Volume Base": Number(calculationTotalVolumeBaseMetric),
                            "Commission Percentage": Number(commissionInputPercentageValue / 100),
                            "Payout Status": "Pending"
                        };
                        await dispatchPostRESTRequestHandshake('Commissions Ledger', commissionPayloadData);
                    }
                }

                alert("🟢 POS Checkout Matrix Securely Synchronized to Cloud System.");
                location.reload();

            } catch (pipelineExecutionFaultException) {
                console.error("❌ Checkout Pipeline Interruption Fault Exception:", pipelineExecutionFaultException);
                alert("POS Execution Aborted:\n" + pipelineExecutionFaultException.message);
            }
        };
    }
});

function toggleCommissionAddonLabel() {
    const selectorTypeNode = document.getElementById('intakeCommType');
    const structuralLabelElementNode = document.getElementById('lblCommValue');
    if (!selectorTypeNode || !structuralLabelElementNode) return;
    structuralLabelElementNode.innerText = selectorTypeNode.value === 'LKR' ? 'Commission Value Allocation (රු.)' : 'Commission Percentage Split Rate (%)';
}
