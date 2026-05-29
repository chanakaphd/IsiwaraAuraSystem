/**
 * Isiwara Aura - Core System Parameters and Local Cache Exporter Engine
 */

function saveSystemSettingsFromAdmin() {
    console.log("Initialization trigger received: Processing system configurations handshake save...");
    
    const apiKeyInput = document.getElementById('sysApiKeyEdit');
    const baseIdInput = document.getElementById('sysBaseIdEdit');
    const coNameInput = document.getElementById('cfgCoName');
    const coPrintInput = document.getElementById('cfgCoPrintName');
    const coRegInput = document.getElementById('cfgCoRegNo');
    const coLogoInput = document.getElementById('cfgCoLogoUrl');

    if (!apiKeyInput || !baseIdInput) {
        alert("Configuration Error: Form inputs are not accessible in the current DOM state.");
        return;
    }

    const cleanApiKey = apiKeyInput.value.trim();
    const cleanBaseId = baseIdInput.value.trim();

    if (!cleanApiKey || !cleanBaseId) {
        alert("Validation Failure:\nYou must supply both a valid Bearer Token and Base ID to successfully build the data pipeline.");
        return;
    }

    try {
        // 1. Commit primary endpoint security vectors to persistent browser cache pools
        localStorage.setItem('AIRTABLE_API_KEY', cleanApiKey);
        localStorage.setItem('BASE_ID', cleanBaseId);

        // 2. Commit optional operational print variables definitions
        if (coNameInput) localStorage.setItem('co_name_override', coNameInput.value.trim());
        if (coPrintInput) localStorage.setItem('co_print_name', coPrintInput.value.trim());
        if (coRegInput) localStorage.setItem('co_reg_no', coRegInput.value.trim());
        if (coLogoInput) localStorage.setItem('co_logo_src', coLogoInput.value.trim());

        alert("Handshake Complete!\nAPI parameters committed to browser local configuration tables. System will now reload to synchronize live cloud records.");
        
        // 3. Force instant clear reload to execute fresh background fetching routines
        window.location.reload();
        
    } catch (cacheError) {
        console.error("Local Storage Write Violation:", cacheError);
        alert("Browser Storage Error: Device write permission configurations blocked cache commitment.");
    }
}
