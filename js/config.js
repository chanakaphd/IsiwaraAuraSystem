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
