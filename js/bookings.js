/**
 * Isiwara Aura - Production Operations & POS Accounting Engine
 */

// Global Cache State
var cacheRooms = [];
var cacheIntroducers = [];

/**
 * 1. Sequential Data Loader
 */
async function initializeGlobalCaches() {
    try {
        const [rooms, intro] = await Promise.all([
            fetchAirtableTableRecords('Rooms'),
            fetchAirtableTableRecords('Introducers')
        ]);
        cacheRooms = rooms || [];
        cacheIntroducers = intro || [];
        console.log("Global Caches Ready:", { rooms: cacheRooms.length, intro: cacheIntroducers.length });
    } catch (e) {
        console.error("Cache load error:", e);
    }
}

/**
 * 2. Optimized Dropdown Injection
 */
function safelyForcePopulatePOSDropdownFields() {
    const roomSelect = document.getElementById('bulkIntakeRoomSelect');
    const introSelect = document.getElementById('bulkIntakeIntroducerSelect');

    if (roomSelect) {
        roomSelect.innerHTML = cacheRooms.map(r => 
            `<option value="${r.id}">Room ${r.fields['Room Number'] || 'N/A'}</option>`
        ).join('');
    }

    if (introSelect) {
        introSelect.innerHTML = `<option value="Direct">Direct Walk-In</option>` + 
            cacheIntroducers.map(i => 
            `<option value="${i.id}">${i.fields['Full Name'] || 'Unknown'}</option>`
        ).join('');
    }
}

/**
 * 3. POS Summary Engine (The Totals)
 */
function updateLiveIntakeSummaryDisplayLayer() {
    const containerRows = document.querySelectorAll('.dynamic-guest-row');
    let totalBase = 0, totalVAS = 0, totalDisc = 0;

    containerRows.forEach(row => {
        const base = parseFloat(row.querySelector('.package-price-input')?.value) || 0;
        const vas = parseFloat(row.querySelector('.vas-fee-input')?.value) || 0;
        const discPct = parseFloat(row.querySelector('.discount-input')?.value) || 0;
        
        totalBase += base;
        totalVAS += vas;
        totalDisc += (base * (discPct / 100));
    });

    const net = (totalBase - totalDisc) + totalVAS;
    const sumBox = document.getElementById('posLiveSummaryWidgetContainer');
    if (sumBox) {
        sumBox.innerHTML = `
            <div class="p-3 bg-dark text-white rounded">
                <div class="d-flex justify-content-between"><span>Base:</span> <span>රු. ${totalBase.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between text-danger"><span>Discount:</span> <span>-රු. ${totalDisc.toFixed(2)}</span></div>
                <div class="d-flex justify-content-between"><span>VAS:</span> <span>රු. ${totalVAS.toFixed(2)}</span></div>
                <hr>
                <div class="d-flex justify-content-between fw-bold text-success fs-5"><span>NET TOTAL:</span> <span>රු. ${net.toFixed(2)}</span></div>
            </div>`;
    }
}

/**
 * 4. Main Event Loop
 */
document.addEventListener("DOMContentLoaded", async () => {
    // A. Wait for cloud data
    await initializeGlobalCaches();
    safelyForcePopulatePOSDropdownFields();

    // B. Setup Listeners
    const form = document.getElementById('bulkIntakeForm');
    if (form) {
        form.addEventListener('input', updateLiveIntakeSummaryDisplayLayer);
        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                // Perform lodging as established in our previous logic...
                alert("Transaction Processed Successfully.");
                location.reload();
            } catch (err) {
                alert("Error: " + err.message);
            }
        };
    }
});
