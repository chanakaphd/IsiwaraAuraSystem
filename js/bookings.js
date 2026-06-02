/**
 * Isiwara Aura - Production Operations & POS Accounting Engine
 * RE-ARRANGED: Fixed routing parameters, decoupled mapping, and reactive metrics.
 */

// Global Cache State Matrix
var cacheRooms = [];
var cacheIntroducers = [];

/**
 * 1. Global Cache Initialization (Queries the TABLE Endpoints)
 */
async function initializeGlobalCaches() {
    try {
        console.log("📡 Initializing cloud sync handshake for base tables...");
        
        // CRITICAL FIX: We must fetch the actual TABLES ('Rooms', 'Introducers')
        const [roomsResponse, introducersResponse] = await Promise.all([
            fetchAirtableTableRecords('Rooms'),
            fetchAirtableTableRecords('Introducers')
        ]);
        
        cacheRooms = roomsResponse || [];
        cacheIntroducers = introducersResponse || [];
        
        console.log("✅ Cloud Sync Handshake Success:", { 
            roomsFetched: cacheRooms.length, 
            introducersFetched: cacheIntroducers.length 
        });
    } catch (networkException) {
        console.error("❌ Cache Engine Initialization Failed:", networkException);
    }
}

/**
 * 2. Dropdown UI Population Layer (Maps to internal COLUMN Fields)
 */
function safelyForcePopulatePOSDropdownFields() {
    console.log("📥 Injecting memory arrays into physical UI dropdown selectors...");

    const roomSelect = document.getElementById('bulkIntakeRoomSelect');
    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');

    // Populate Target Rooms
    if (roomSelect) {
        if (cacheRooms.length === 0) {
            roomSelect.innerHTML = `<option value="">❌ No Rooms Loaded from Server</option>`;
        } else {
            roomSelect.innerHTML = cacheRooms.map(room => {
                const recordId = room.id;
                const roomNumberValue = room.fields['Room Number']; // Column Header reference
                
                if (!roomNumberValue) return ''; // Skip uninitialized rows gracefully
                return `<option value="${recordId}">Treatment Room ${roomNumberValue}</option>`;
            }).join('');
        }
    }

    // Populate Partner Introducers
    if (introSelect) {
        let initialOptions = `<option value="Direct">Direct Walk-In (No Commission)</option>`;
        
        if (cacheIntroducers.length > 0) {
            const dynamicOptions = cacheIntroducers.map(intro => {
                const recordId = intro.id;
                const fullNameValue = intro.fields['Full Name']; // Column Header reference
                
                if (!fullNameValue) return '';
                return `<option value="${recordId}">${fullNameValue}</option>`;
            }).join('');
            introSelect.innerHTML = initialOptions + dynamicOptions;
        } else {
            introSelect.innerHTML = initialOptions;
        }
    }
}

/**
 * 3. POS Live Accounting Calculation & Summary Render Node
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row');
    if (containerRows.length === 0) return;

    let totalTreatmentAmount = 0;
    let totalVasAmount = 0;
    let totalDiscountAmount = 0;

    containerRows.forEach(row => {
        // Query numeric entry arrays safely
        const priceInput = row.querySelector('.package-price-input') || row.querySelectorAll('input[type="number"]')[0];
        const vasInput = row.querySelector('.vas-fee-input') || row.querySelectorAll('input[type="number"]')[1];
        const discInput = row.querySelector('.discount-input') || row.querySelectorAll('input[type="number"]')[2];

        const basePrice = parseFloat(priceInput?.value) || 0;
        const vasFee = parseFloat(vasInput?.value) || 0;
        const discountPercentage = parseFloat(discInput?.value) || 0;

        const calculatedDiscount = basePrice * (discountPercentage / 100);

        totalTreatmentAmount += basePrice;
        totalVasAmount += vasFee;
        totalDiscountAmount += calculatedDiscount;
    });

    const aggregateNetTotal = (totalTreatmentAmount - totalDiscountAmount) + totalVasAmount;
    const summaryWidgetContainer = document.getElementById('posLiveSummaryWidgetContainer');
    
    if (summaryWidgetContainer) {
        summaryWidgetContainer.innerHTML = `
            <div class="card bg-dark text-white border-secondary p-3 mt-3 animate-fade-in">
                <div class="d-flex justify-content-between my-1"><span class="small text-muted">Gross Treatment Base:</span> <span class="font-monospace">රු. ${totalTreatmentAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                <div class="d-flex justify-content-between my-1"><span class="small text-muted">Value Added Services (VAS):</span> <span class="font-monospace">රු. ${totalVasAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                <div class="d-flex justify-content-between my-1 text-danger"><span class="small text-danger fw-bold">Deductions / Discounts:</span> <span class="font-monospace">-රු. ${totalDiscountAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                <div class="border-top border-secondary my-2 pt-2 d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-success">NET SETTLEMENT TOTAL:</span>
                    <span class="fs-4 fw-bold text-success font-monospace">රු. ${aggregateNetTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            </div>`;
    }
}

/**
 * 4. Micro-Execution Orchestrator Lifecycle
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Stage A: Await data sync synchronously prior to drawing elements
    await initializeGlobalCaches();
    
    // Stage B: Inject variables into visual layout
    safelyForcePopulatePOSDropdownFields();
    updateLiveIntakeSummaryDisplayLayer();

    // Stage C: Bind Event Listener Modules
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (bulkIntakeForm) {
        bulkIntakeForm.addEventListener('input', updateLiveIntakeSummaryDisplayLayer);
        bulkIntakeForm.addEventListener('change', updateLiveIntakeSummaryDisplayLayer);

        // Form Submit Handler Block
        bulkIntakeForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log("🚀 Pipeline Execution: Spawning transaction transaction tree...");
            
            try {
                const targetRoomRecordId = document.getElementById('bulkIntakeRoomSelect').value;
                const targetIntroducerRecordId = document.getElementById('bulkIntakeIntroducerSelect').value;

                if (!targetRoomRecordId) {
                    throw new Error("UI Isolation Fault: Cannot process invoice without valid room assignment registration.");
                }

                const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row');
                
                for (let row of containerRows) {
                    const nameField = row.querySelector('input[type="text"]');
                    if (!nameField) continue;
                    const guestNameStr = nameField.value.trim();
                    if (!guestNameStr) continue;

                    const inputs = row.querySelectorAll('input[type="number"]');
                    const rawPackagePrice = inputs[0] ? parseFloat(inputs[0].value) || 0 : 0;
                    const manualVasFee = inputs[1] ? parseFloat(inputs[1].value) || 0 : 0;
                    const discountPercentage = inputs[2] ? parseFloat(inputs[2].value) || 0 : 0;
                    
                    const calculatedDiscountAmount = rawPackagePrice * (discountPercentage / 100);
                    const netBaseRevenue = rawPackagePrice - calculatedDiscountAmount;

                    // Write Node A: Register unique Guest Profile
                    let guestProfileRecord = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestNameStr });
                    if (!guestProfileRecord || !guestProfileRecord.id) throw new Error("Data Lodgment Break: Guest generation aborted by host.");

                    // Write Node B: Link Booking Entry to assigned parameters
                    let bookingEntryRecord = await dispatchPostRESTRequestHandshake('Bookings', {
                        "Guest": [guestProfileRecord.id],
                        "Room": [targetRoomRecordId],
                        "Status": "Completed"
                    });
                    if (!bookingEntryRecord || !bookingEntryRecord.id) throw new Error("Data Lodgment Break: Booking generation aborted by host.");

                    // Write Node C: Dispatch Ledger Double-Entry
                    const financialPayload = {
                        "Booking Link": [bookingEntryRecord.id],
                        "Base Revenue": Number(netBaseRevenue) || 0,
                        "VAS Revenue": Number(manualVasFee) || 0,
                        "Settlement Type": document.getElementById('bulkSettlementMethod')?.value || 'Cash'
                    };

                    const finResult = await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);
                    if (!finResult || finResult.error) throw new Error(`Double-Entry Balancing Aborted: ${finResult ? finResult.error.message : 'Unknown rejection'}`);

                    // Write Node D: Optional Commission Allocation
                    if (targetIntroducerRecordId && targetIntroducerRecordId !== "Direct") {
                        const commissionPayload = {
                            "Booking Link": [bookingEntryRecord.id],
                            "Introducer Link": [targetIntroducerRecordId],
                            "Total Volume Base": Number(rawPackagePrice + manualVasFee) || 0,
                            "Commission Percentage": document.getElementById('intakeCommType')?.value === 'PCT' ? (parseInt(document.getElementById('intakeCommValue').value, 10) || 0) : 0,
                            "Payout Status": "Pending"
                        };
                        await dispatchPostRESTRequestHandshake('Commissions Ledger', commissionPayload);
                    }
                }

                alert("🟢 Transaction Successfully Logged to System Cloud Infrastructure.");
                location.reload();

            } catch (pipelineException) {
                console.error("❌ Critical POS System Runtime Interruption:", pipelineException);
                alert("Transaction Execution Aborted:\n" + pipelineException.message);
            }
        };
    }
});
