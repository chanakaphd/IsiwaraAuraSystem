/**
 * Isiwara Aura Management Architecture - Global Configurations Register
 */

// Core Security Bearer and Base Storage Key Handshakes
let AIRTABLE_API_KEY = localStorage.getItem('isiwara_api_key') || '';
let BASE_ID = localStorage.getItem('isiwara_base_id') || '';

// Live Progress Background Timers Memory Slots Registry
let localLiveTimerQueueDatabase = [];

// Volatile Application Metadata Synchronization Cache Matrices
let cacheRooms = [];
let cacheTreatments = [];
let cacheTherapists = [];
let cacheIntroducers = [];
let cacheRoles = [];
let globalCountriesList = [];

// Active Operation Target Index Tracker for Completion Overlays Interventions
let currentInterventionNodeIndex = null;
let activeGuestCountInModal = 0;

/**
 * Initializes Global Country Dial Codes and Phone Mask Patterns
 */
function initializeCountryLookupTableDataset() {
    globalCountriesList = [
        { name: "Sri Lanka", code: "+94" },
        { name: "United Kingdom", code: "+44" },
        { name: "Germany", code: "+49" },
        { name: "Australia", code: "+61" },
        { name: "India", code: "+91" },
        { name: "United States", code: "+1" },
        { name: "France", code: "+33" },
        { name: "Maldives", code: "+960" },
        { name: "Russia", code: "+7" },
        { name: "China", code: "+86" }
    ];
}

// Execute baseline configurations storage hooks automatically on load
initializeCountryLookupTableDataset();
/**
 * Global Workspace View Router Matrix
 * Switches active dashboard panes visibility layers cleanly
 * @param {string} viewName - Key matching the target panel HTML element ID
 */
function showTab(viewName) {
    // 1. Hide all active workspace sub-panels dynamically
    document.querySelectorAll('.tab-pane').forEach(element => {
        element.style.display = 'none';
    });
    
    // 2. Clear out active hover state CSS design classes from all side links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 3. Make target window panel view block visible
    const targetPane = document.getElementById(`${viewName}-view`);
    if (targetPane) {
        targetPane.style.display = 'block';
    }
    
    // 4. Highlight the active clicked sidebar navigation item anchor
    const activeMenuAnchor = document.getElementById(`nav-${viewName}`);
    if (activeMenuAnchor) {
        activeMenuAnchor.classList.add('active');
    }

    // 5. Instantly route dynamic fetching requests to synchronize specific tables arrays
    if (viewName === 'bookings' && typeof fetchAndRenderMasterScheduleView === 'function') fetchAndRenderMasterScheduleView();
    if (viewName === 'manage' && typeof drawLiveManagementInterfaceBoard === 'function') drawLiveManagementInterfaceBoard();
    if (viewName === 'financials' && typeof fetchAndRenderFinancialLedgersView === 'function') fetchAndRenderFinancialLedgersView();
    if (viewName === 'commissions' && typeof fetchAndRenderCommissionsView === 'function') fetchAndRenderCommissionsView();
    if (viewName === 'guests' && typeof fetchAndRenderGuestsView === 'function') fetchAndRenderGuestsView();
    if (viewName === 'reports' && typeof compileStrategicReportHubAnalytics === 'function') compileStrategicReportHubAnalytics();
    if (viewName === 'admin' && typeof showAdminSubTab === 'function') showAdminSubTab('treatments');
}
