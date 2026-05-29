/**
 * Isiwara Aura Management Architecture - Global Configurations Register
 */

/**
 * Isiwara Aura - Core Global Memory States Cache
 */

// Core Security Bearer and Base Storage Key Handshakes
var AIRTABLE_API_KEY = localStorage.getItem('AIRTABLE_API_KEY') || '';
var BASE_ID = localStorage.getItem('BASE_ID') || '';

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
/**
 * Saves Admin Handshake Settings to Browser Storage
 * Captures keys, saves them locally, and executes a clean app reboot
 */
function saveSystemSettingsFromAdmin() {
    const apiKeyInput = document.getElementById('sysApiKeyEdit');
    const baseIdInput = document.getElementById('sysBaseIdEdit');
    const coNameInput = document.getElementById('cfgCoName');
    const coPrintInput = document.getElementById('cfgCoPrintName');
    const coRegInput = document.getElementById('cfgCoRegNo');
    const coLogoInput = document.getElementById('cfgCoLogoUrl');

    if (!apiKeyInput || !baseIdInput) {
        alert("Configuration Error: Form components mapped incorrectly.");
        return;
    }

    const cleanApiKey = apiKeyInput.value.trim();
    const cleanBaseId = baseIdInput.value.trim();

    if (!cleanApiKey || !cleanBaseId) {
        alert("Validation Error:\nYou must supply both a valid Bearer Token and Base ID to link your Airtable account.");
        return;
    }

    // 1. Commit credentials permanently to localStorage cache pools
    localStorage.setItem('AIRTABLE_API_KEY', cleanApiKey);
    localStorage.setItem('BASE_ID', cleanBaseId);

    // 2. Commit optional document branding overrides
    if (coNameInput) localStorage.setItem('co_name_override', coNameInput.value.trim());
    if (coPrintInput) localStorage.setItem('co_print_name', coPrintInput.value.trim());
    if (coRegInput) localStorage.setItem('co_reg_no', coRegInput.value.trim());
    if (coLogoInput) localStorage.setItem('co_logo_src', coLogoInput.value.trim());

    // 3. Notify user with custom toast overlay if available, otherwise native alert
    if (typeof triggerCustomSwalNotification === 'function') {
        triggerCustomSwalNotification("Handshake Saved!", "System parameters overwritten. Synchronizing connection streams...");
    } else {
        alert("Handshake Saved Successfully!\nSystem will now reboot to sync live database streams.");
    }

    // 4. Force a hard window reload after a 1.2-second pause to let the user process the confirmation
    setTimeout(() => {
        window.location.reload();
    }, 1200);
}
