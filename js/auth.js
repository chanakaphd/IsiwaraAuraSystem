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

    let accessGranted = false;
    let assignedUserRole = 'Front Office';

    // FIRST PRIORITY: Check local emergency administrator fallback bypass instantly
    if (enteredUser === 'admin' && enteredPass === 'admin') {
        accessGranted = true;
        assignedUserRole = 'Administrator';
    } 
    // SECOND PRIORITY: If not admin/admin, attempt online sync
    else if (typeof cacheUsersPool !== 'undefined' && cacheUsersPool.length > 0) {
        const matchedRecord = cacheUsersPool.find(u => 
            u.fields.Username === enteredUser && u.fields.Password === enteredPass
        );
        if (matchedRecord) {
            accessGranted = true;
            assignedUserRole = matchedRecord.fields.Role || 'Front Office';
        }
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
 * Post-Login Operational Sequence Coordinator
 * Dispatches synchronization requests and reveals the active schedule dashboard view panel layout layers
 */
async function executePostLoginInitializationSequence() {
    console.log("🔒 Authentication verified successfully. Initializing system dashboard context variables...");

    // 1. Instantly trigger background synchronization for metadata arrays caches
    if (typeof synchronizeLocalMetadataCachePools === 'function') {
        await synchronizeLocalMetadataCachePools();
    }

    // 2. Clear out any residual boot display blockers
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'none';
    }

    // 3. Router redirect: Fire the default workspace viewport layout (The Master Schedule Grid)
    if (typeof showTab === 'function') {
        showTab('bookings');
    } else {
        // Fallback layout activation mechanism if config workspace router drops
        const bookingsPane = document.getElementById('bookings-view');
        if (bookingsPane) bookingsPane.style.display = 'block';
    }
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
