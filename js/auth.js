/**
 * Isiwara Aura - Authentication Gate & Session Lifecycle Controller
 */

// Core Session Configuration Parameters
const SESSION_TIMEOUT_MS = 20 * 60 * 1000; // 20 Minutes standard idle threshold
let sessionIdleTimerReference = null;

/**
 * Initializes Authentication Gates and Session Handshaking Loops
 */
function initializeAuthenticationLifecycle() {
    // Check if a valid login token state is already active in sessionStorage
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const overlayNode = document.getElementById('login-overlay');
        if (overlayNode) overlayNode.style.display = 'none';
        
        executePostLoginInitializationSequence();
    } else {
        const overlayNode = document.getElementById('login-overlay');
        if (overlayNode) overlayNode.style.display = 'flex';
    }

    // Bind intercept handlers to the login form DOM element
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleSecurityAuthenticationSubmission);
    }
}

/**
 * Processes Form Submission Inputs against Active System User Accounts Matrix
 * @param {Event} event - System Submit Event Context
 */
async function handleSecurityAuthenticationSubmission(event) {
    event.preventDefault();
    
    const enteredUser = document.getElementById('loginUser').value.trim();
    const enteredPass = document.getElementById('loginPass').value.trim();
    const submitBtn = event.target.querySelector('button');
    const errorNode = document.getElementById('loginError');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Verifying Account Access Signatures...";
    }
    if (errorNode) errorNode.style.display = 'none';

    // 1. Evaluate credentials against the synchronized Airtable Users data cache
    let accessGranted = false;
    let assignedUserRole = 'Front Office';

    if (typeof cacheUsersPool !== 'undefined' && cacheUsersPool.length > 0) {
        const matchedRecord = cacheUsersPool.find(u => 
            u.fields.Username === enteredUser && u.fields.Password === enteredPass
        );
        if (matchedRecord) {
            accessGranted = true;
            assignedUserRole = matchedRecord.fields.Role || 'Front Office';
        }
    }

    // 2. Fallback Root Developer Override Option to bypass system configuration drops
    if (!accessGranted && enteredUser === 'admin' && enteredPass === 'admin') {
        accessGranted = true;
        assignedUserRole = 'Administrator';
    }

    // 3. Evaluate Authorization State Outcome Paths
    if (accessGranted) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', assignedUserRole);
        
        const overlayNode = document.getElementById('login-overlay');
        if (overlayNode) overlayNode.style.display = 'none';
        
        executePostLoginInitializationSequence();
    } else {
        if (errorNode) errorNode.style.display = 'block';
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Authenticate Terminal Connection";
        }
    }
}

/**
 * Spawns core telemetry trackers, timers, and view renders after successful gate pass
 */
function executePostLoginInitializationSequence() {
    // Start automated backend caching loops if available
    if (typeof synchronizeLocalMetadataCachePools === 'function') {
        synchronizeLocalMetadataCachePools().then(() => {
            // Default workspace routing after loading data
            if (typeof showTab === 'function') showTab('bookings');
        });
    } else {
        if (typeof showTab === 'function') showTab('bookings');
    }

    // Engage user idle loop event listening matrices
    resetSessionIdleCountdownTracker();
    const userActivityEvents = ['mousemove', 'keypress', 'mousedown', 'touchstart'];
    userActivityEvents.forEach(eventType => {
        window.addEventListener(eventType, resetSessionIdleCountdownTracker);
    });
}

/**
 * Resets the 20-minute security activity tracker countdown back to base thresholds
 */
function resetSessionIdleCountdownTracker() {
    clearTimeout(sessionIdleTimerReference);
    sessionIdleTimerReference = setTimeout(executeAutomatedSecuritySessionLogout, SESSION_TIMEOUT_MS);
}

/**
 * Forces terminal lock masks and purges temporary memory states upon session timeout or logout
 */
function executeAutomatedSecuritySessionLogout() {
    sessionStorage.clear();
    
    // Purge user activity event listener attachments
    const userActivityEvents = ['mousemove', 'keypress', 'mousedown', 'touchstart'];
    userActivityEvents.forEach(eventType => {
        window.removeEventListener(eventType, resetSessionIdleCountdownTracker);
    });

    // Re-engage screen overlay configuration rules
    const overlayNode = document.getElementById('login-overlay');
    if (overlayNode) overlayNode.style.display = 'flex';
    
    const submitBtn = document.querySelector('#loginForm button');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Authenticate Terminal Connection";
    }

    alert("🔒 SECURITY TIMEOUT LOCK:\nTerminal session suspended due to 20 minutes of inactivity. Re-authenticate to access client files.");
}

/**
 * Explicit public entry handle linked directly to dashboard layout controls
 */
function handleLogout() {
    executeAutomatedSecuritySessionLogout();
}

// Bind foundational checking logic to early script parsing threads safely
window.addEventListener('DOMContentLoaded', initializeAuthenticationLifecycle);
