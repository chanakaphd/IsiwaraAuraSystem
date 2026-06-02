/**
 * Isiwara Aura - Production Operations & POS Accounting Engine
 * RE-ARRANGED: Sequential integrity, robust error handling, and singular naming convention.
 */

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

                // 3. Lodgment of Financial Ledger (Using Singular Name)
                const finPayload = {
                    "Booking Link": [booking.id],
                    "Base Revenue": parseFloat(row.querySelector('.package-price-input').value),
                    "VAS Revenue": parseFloat(row.querySelector('.vas-fee-input').value),
                    "Settlement Type": document.getElementById('bulkSettlementMethod').value
                };
                
                const res = await dispatchPostRESTRequestHandshake('Financial Ledger', finPayload);
                if (res.error) throw new Error(`Ledger Lodgment Failed: ${res.error.message}`);
            }

            alert("POS Transaction Successful");
            location.reload();
        } catch (err) {
            console.error("POS Pipeline Crash:", err);
            alert("POS Transaction Failed: " + err.message);
        }
    };
});
