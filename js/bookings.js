/**
 * Isiwara Aura - Production Operations & POS Accounting Engine
 * RE-ARRANGED: Sequential integrity, robust error handling, and singular naming convention.
 */

// Global Cache State
var cacheRooms = [];
var cacheIntroducers = [];

/**
 * 1. Global Caches: Initialized immediately
 */
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
initializeGlobalCaches();

/**
 * 2. Data Retrieval: Fetching operational logs
 */
async function fetchAndRenderMasterScheduleView() {
    const tableBody = document.getElementById('data-table-body');
    if (!tableBody) return;

    try {
        // Use exact singular names as per your Airtable dashboard
        const [bookingsData, financialsData, commissionsData] = await Promise.all([
            fetchAirtableTableRecords('Bookings'),
            fetchAirtableTableRecords('Financial Ledger'),
            fetchAirtableTableRecords('Commissions Ledger')
        ]);

        console.log("Data Sync Complete:", { bookings: bookingsData?.length, financials: financialsData?.length });
        // ... [Insert your existing rendering map logic here] ...

    } catch (error) {
        console.error("Critical Data Synchronization Fault:", error);
    }
}

/**
 * 3. POS Engine: Orchestrating lodgments
 */
document.addEventListener("DOMContentLoaded", () => {
    const bulkIntakeForm = document.getElementById('bulkIntakeForm');
    if (!bulkIntakeForm) return;

    bulkIntakeForm.onsubmit = async (e) => {
        e.preventDefault();
        
        try {
            const containerRows = document.querySelectorAll('#dynamic-guests-rows-container .row, .dynamic-guest-row');
            if (containerRows.length === 0) throw new Error("No guest rows detected.");

            for (let row of containerRows) {
                // A. Guest & Booking Logic
                const guestName = row.querySelector('input[type="text"]')?.value.trim();
                if (!guestName) continue;

                const guest = await dispatchPostRESTRequestHandshake('Guests', { "Full Name": guestName });
                const booking = await dispatchPostRESTRequestHandshake('Bookings', {
                    "Guest": [guest.id],
                    "Room": [document.getElementById('bulkIntakeRoomSelect')?.value || 'R1'],
                    "Status": "Completed"
                });

                // B. Financial Lodgment (Singular Table Name)
                const financialPayload = {
                    "Booking Link": [booking.id],
                    "Base Revenue": parseFloat(row.querySelector('.package-price-input')?.value || 0),
                    "VAS Revenue": parseFloat(row.querySelector('.vas-fee-input')?.value || 0),
                    "Settlement Type": document.getElementById('bulkSettlementMethod')?.value || 'Cash'
                };

                console.log("Lodging to Financial Ledger:", financialPayload);
                const finRes = await dispatchPostRESTRequestHandshake('Financial Ledger', financialPayload);
                
                if (finRes.error) throw new Error(`Ledger Lodgment Failed: ${finRes.error.message}`);

                // C. Optional Commissions Lodgment
                const introName = document.getElementById('bulkIntakeIntroducerSelect')?.value;
                if (introName && introName !== "Direct Walk-In") {
                    await dispatchPostRESTRequestHandshake('Commissions Ledger', {
                        "Booking Link": [booking.id],
                        "Introducer Link": [introName],
                        "Payout Status": "Pending"
                    });
                }
            }

            alert("POS Transaction Successful");
            location.reload();

        } catch (executionError) {
            console.error("Critical POS Exception caught:", executionError);
            alert("POS Transaction Failed: " + executionError.message);
        }
    };
});
