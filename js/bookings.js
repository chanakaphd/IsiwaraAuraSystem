/**
 * Isiwara Aura - Production Operations & POS Accounting Engine
 * RE-ARRANGED: Sequential integrity, robust error handling, and singular naming convention.
 */
// Add this to your utility or api file
// TEMPORARY: Replace your fetch call with this to see if the connection works
const BASE_ID = 'appUiKkBwfVFQXJja'; // Your real ID
const KEY = 'patTKmyobin6uTUoi.c895afd7543968d1740ba8626d9160048e1703c2fb6475a7f7319d7cec90825e'; // Your real Key

// Test the call directly
fetch(`https://api.airtable.com/v0/${BASE_ID}/Financial%20Ledger`, {
    headers: { 'Authorization': `Bearer ${KEY}` }
}).then(res => console.log("Result:", res.status));
// Global Cache State
var cacheRooms = [];
var cacheIntroducers = [];

async function initializeGlobalCaches() {
    try {
        const [rooms, intro] = await Promise.all([
            fetchAirtableTableRecords('Rooms'),
            fetchAirtableTableRecords('Introducers')
        ]);
        cacheRooms = rooms || [];
        cacheIntroducers = intro || [];
        console.log("Global caches initialized:", { rooms: cacheRooms.length, intro: cacheIntroducers.length });
    } catch (e) {
        console.error("Cache initialization failed:", e);
    }
}
// Call this once on load
initializeGlobalCaches();
// 1. Core Data Retrieval (Modularized for reliability)
async function fetchAndRenderMasterScheduleView() {
    const tableBody = document.getElementById('data-table-body');
    if (!tableBody) return;

    try {
        // Ensure singular naming matches Airtable EXACTLY
        const [bookingsData, financialsData, commissionsData] = await Promise.all([
            fetchAirtableTableRecords('Bookings'),
            fetchAirtableTableRecords('Financial Ledger'),
            fetchAirtableTableRecords('Commissions Ledger')
        ]);

        // ... [Insert your existing rendering map logic here] ...
    } catch (error) {
        console.error("Critical Data Synchronization Fault:", error);
    }
}

// 2. Calculation Engine (Optimized for performance)
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row');
    if (containerRows.length === 0) return;

    let totalTreatment = 0, totalVas = 0, totalDiscount = 0, totalComm = 0;
    const commType = document.getElementById('intakeCommType')?.value || 'LKR';
    const commVal = parseFloat(document.getElementById('intakeCommValue')?.value) || 0;

    containerRows.forEach(row => {
        const pInput = row.querySelector('.package-price-input');
        const vInput = row.querySelector('.vas-fee-input');
        const dInput = row.querySelector('.discount-input');

        const base = parseFloat(pInput?.value) || 0;
        const vas = parseFloat(vInput?.value) || 0;
        const disc = base * ((parseFloat(dInput?.value) || 0) / 100);

        totalTreatment += base;
        totalVas += vas;
        totalDiscount += disc;

        totalComm += (commType === 'PCT') ? (base + vas) * (commVal / 100) : (commVal / containerRows.length);
    });

    const netTotal = (totalTreatment - totalDiscount) + totalVas;
    const sumBox = document.getElementById('posLiveSummaryWidgetContainer');
    
    if (sumBox) {
        sumBox.innerHTML = `
            <div class="card bg-dark text-white p-3">
                <div class="d-flex justify-content-between"><span>Treatment:</span> <span>රු. ${totalTreatment.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between text-danger"><span>Discount:</span> <span>-රු. ${totalDiscount.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between mt-2 pt-2 border-top border-success fw-bold text-success fs-5"><span>NET:</span> <span>රු. ${netTotal.toFixed(2)}</span></div>
            </div>`;
    }
}

// 3. POS Engine (Arranged for sequential integrity)
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (!bulkIntakeForm) return;

    bulkIntakeForm.onsubmit = async (e) => {
        e.preventDefault();
        
        try {
            // A. Validate Dependencies
            const roomId = getSelectedRoomId(); // Abstracted selector for cleanliness
            if (!roomId) throw new Error("No Room selected.");

            const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row');

            for (let row of containerRows) {
                // 1. Create Guest
                const guest = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": row.querySelector('input[type="text"]').value });
                
                // 2. Create Booking
                const booking = await dispatchPostRESTRequestHandshake('Bookings', {
                    "Guest": [guest.id],
                    "Room": [roomId],
                    "Status": "Completed"
                });

               // 1. Lodgment of Financial Ledger (Only once!)
const finResult = await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);

// Check if the first lodgment failed
if (finResult.error) {
    throw new Error(`Financial Ledger Lodgment Failed: ${finResult.error.message}`);
}

// 2. Lodgment of Commissions Ledger (Only if introducer exists)
if (resolvedIntroducerRecordId) {
    const commResult = await dispatchPostRESTRequestHandshake('Commissions Ledger', commissionPayload);
    
    // Check if the commission lodgment failed
    if (commResult.error) {
        throw new Error(`Commissions Ledger Lodgment Failed: ${commResult.error.message}`);
    }
}

// 3. Success - Only alert once all database operations have cleared
alert("POS Transaction Successful: Records lodged to Financial & Commissions Ledgers.");
location.reload();

} catch (executionError) {
    console.error("Critical POS Exception caught:", executionError);
    alert("POS Transaction Failed: " + executionError.message);
}
        }; // End of onsubmit
    } // End of if
}); // End of DOMContentLoaded
