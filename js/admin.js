/**
 * Isiwara Aura - Administrative Configurations Submodules Panel Controller
 */

/**
 * Handles individual dynamic nested sub-tab context switches inside the Admin Panel.
 * Automatically synchronizes table grids against raw cloud datasets.
 * @param {string} subTab - Target sub-tab index identifier key string
 */
async function showAdminSubTab(subTab) {
    const content = document.getElementById('admin-content');
    if (!content) return;

    // Toggle active list-group item CSS states visually
    document.querySelectorAll('#adminSubTabsList .list-group-item').forEach(btn => {
        btn.classList.remove('active'); 
        if (btn.getAttribute('data-tab') === subTab) btn.classList.add('active');
    });

    // ----------------------------------------------------
    // SUB-TAB MODULE WRAPPER: TREATMENTS CONFIGURATIONS MENU
    // ----------------------------------------------------
    if (subTab === 'treatments') {
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Service Menu Pricing Matrix</h5>
                <button class="btn btn-sm btn-success text-white fw-bold" onclick="safeOpenModal('addTreatmentModal')">+ Add Treatment Menu</button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light"><tr><th>Treatment Name</th><th>Duration Minutes</th><th>Base Price (LKR)</th></tr></thead>
                    <tbody id="lbl-admin-tx-list"></tbody>
                </table>
            </div>
        `;
        
        const listBody = document.getElementById('lbl-admin-tx-list');
        listBody.innerHTML = cacheTreatments.map(t => `
            <tr class="animate-fade-in">
                <td><strong>${t.fields['Treatment Name']}</strong></td>
                <td>⏱️ ${t.fields['Duration in Minutes']} mins</td>
                <td class="fw-bold text-success">රු. ${(t.fields['Price'] || 0).toLocaleString()}</td>
            </tr>
        `).join('') || '<tr><td colspan="3" class="text-center text-muted py-2">No treatments synced from database.</td></tr>';
        
        // Safety Wrapper bound element check to prevent startup execution freeze context drops
        const treatmentForm = document.getElementById('treatmentForm');
        if (treatmentForm) {
            treatmentForm.onsubmit = async (e) => {
                e.preventDefault();
                const fields = { 
                    "Treatment Name": document.getElementById('newTreatmentName').value.trim(), 
                    "Price": parseFloat(document.getElementById('newTreatmentPrice').value), 
                    "Duration in Minutes": parseInt(document.getElementById('newTreatmentDuration').value, 10) 
                };
                await dispatchPostRESTRequestHandshake('Treatments', fields); 
                safeCloseModal('addTreatmentModal'); 
                await synchronizeLocalMetadataCachePools(); 
                showAdminSubTab('treatments');
                treatmentForm.reset();
            };
        }
    } 
    
    // ----------------------------------------------------
    // SUB-TAB MODULE WRAPPER: THERAPISTS ROSTER MANAGEMENT
    // ----------------------------------------------------
    else if (subTab === 'therapists') {
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Therapist Professional Practitioner Roster</h5>
                <button class="btn btn-sm btn-success text-white fw-bold" onclick="safeOpenModal('addTherapistModal')">+ Register Therapist</button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light"><tr><th>Practitioner Specialist Name</th><th>Primary Assignment Specialty</th><th>Availability Status</th></tr></thead>
                    <tbody id="lbl-admin-th-list"></tbody>
                </table>
            </div>
        `;
        
        const listBody = document.getElementById('lbl-admin-th-list');
        listBody.innerHTML = cacheTherapists.map(s => `
            <tr class="animate-fade-in">
                <td><strong>👤 ${s.fields['Name']}</strong></td>
                <td><span class="badge bg-light text-dark border">${s.fields['Specialty'] || 'General Practice'}</span></td>
                <td><span class="badge bg-success">${s.fields['Availability Status'] || 'Available'}</span></td>
            </tr>
        `).join('') || '<tr><td colspan="3" class="text-center text-muted py-2">No therapist roster lines recorded.</td></tr>';
        
        const therapistForm = document.getElementById('therapistForm');
        if (therapistForm) {
            therapistForm.onsubmit = async (e) => {
                e.preventDefault();
                const fields = { 
                    "Name": document.getElementById('newTherapistName').value.trim(), 
                    "Specialty": document.getElementById('newTherapistSpecialty').value.trim(), 
                    "Availability Status": "Available" 
                };
                await dispatchPostRESTRequestHandshake('Therapists', fields); 
                safeCloseModal('addTherapistModal'); 
                await synchronizeLocalMetadataCachePools(); 
                showAdminSubTab('therapists');
                therapistForm.reset();
            };
        }
    }
    
    // ----------------------------------------------------
    // SUB-TAB MODULE WRAPPER: OPERATIONAL PERSONNEL SYSTEM USERS
    // ----------------------------------------------------
    else if (subTab === 'users') {
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Authorized System Access Operators</h5>
                <button class="btn btn-sm btn-dark fw-bold text-white" onclick="safeOpenModal('addUserModal')">+ Create Access Account</button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light"><tr><th>Username Reference</th><th>Full Legal Identity Name</th><th>Access Authorization Role</th><th>Actions Control</th></tr></thead>
                    <tbody id="lbl-admin-user-list"></tbody>
                </table>
            </div>
        `;
        
        const roleDropdownSelect = document.getElementById('newUserRoleSelect');
        if (roleDropdownSelect) {
            roleDropdownSelect.innerHTML = cacheRoles.map(r => 
                `<option value="${r.fields['Role Name']}">${r.fields['Role Name']}</option>`
            ).join('') || '<option value="Administrator">Administrator</option><option value="Front Office">Front Office Desk</option><option value="Owner">Center Owner</option><option value="Cashier">Cashier</option>';
        }

        const listBody = document.getElementById('lbl-admin-user-list');
        listBody.innerHTML = `<tr><td colspan="4" class="text-center font-monospace small">Fetching cloud security parameters registries...</td></tr>`;

        if (typeof AIRTABLE_API_KEY !== 'undefined' && AIRTABLE_API_KEY) {
            try {
                const res = await fetchAirtableTableRecords('Users');
                listBody.innerHTML = (res || []).map(u => `
                    <tr class="animate-fade-in">
                        <td><strong>${u.fields['Username']}</strong></td>
                        <td>${u.fields['Full Name'] || 'Not Provided'}</td>
                        <td><span class="badge bg-success">${u.fields['Role'] || 'Staff User'}</span></td>
                        <td><button class="btn btn-xs btn-outline-danger py-0 font-monospace fw-bold" style="font-size:11px;" onclick="revokeUserAccessAuthenticationRecord('${u.id}')">✕ Revoke Access</button></td>
                    </tr>
                `).join('') || '<tr><td colspan="4" class="text-center text-muted">No security profiles logged.</td></tr>';
            } catch(e) { listBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Failed to sync security table rows.</td></tr>`; }
        }
        
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.onsubmit = async (e) => {
                e.preventDefault();
                const fields = { 
                    "Username": document.getElementById('newUserName').value.trim(), 
                    "Password": document.getElementById('newUserPass').value.trim(), 
                    "Full Name": document.getElementById('newUserFullName').value.trim(), 
                    "Calling Name": document.getElementById('newUserCallingName').value.trim(), 
                    "NIC": document.getElementById('newUserNIC').value.trim(), 
                    "Role": document.getElementById('newUserRoleSelect').value, 
                    "Status": "Active" 
                };
                await dispatchPostRESTRequestHandshake('Users', fields); 
                safeCloseModal('addUserModal'); 
                await synchronizeLocalMetadataCachePools();
                showAdminSubTab('users');
                userForm.reset();
            };
        }
    }
    
    // ----------------------------------------------------
    // SUB-TAB MODULE WRAPPER: SPATIAL ROOM ZONING MATRIX
    // ----------------------------------------------------
    else if (subTab === 'rooms') {
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Physical Spatial Therapy Room Allocation Units</h5>
                <button class="btn btn-sm btn-success text-white fw-bold" onclick="safeOpenModal('addRoomModal')">+ Add Spatial Unit</button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light"><tr><th>Room Reference ID Number</th><th>Available Beds Spaces Capacity</th><th>Zoning Layout Typing</th></tr></thead>
                    <tbody id="lbl-admin-rm-list"></tbody>
                </table>
            </div>
        `;
        
        const listBody = document.getElementById('lbl-admin-rm-list');
        listBody.innerHTML = cacheRooms.map(r => `
            <tr class="animate-fade-in">
                <td>🚪 <strong>Unit: ${r.fields['Room Number']}</strong></td>
                <td>${r.fields['Beds Count']} Bed Lines Capacity</td>
                <td><span class="badge bg-light text-dark border">${r.fields['Room Type']}</span></td>
            </tr>
        `).join('') || '<tr><td colspan="3" class="text-center text-muted py-2">No physical spaces initialized.</td></tr>';
        
        const roomForm = document.getElementById('roomForm');
        if (roomForm) {
            roomForm.onsubmit = async (e) => {
                e.preventDefault();
                const fields = { 
                    "Room Number": document.getElementById('newRoomNumber').value.trim(), 
                    "Beds Count": parseInt(document.getElementById('newRoomBeds').value, 10), 
                    "Room Type": document.getElementById('newRoomType').value 
                };
                await dispatchPostRESTRequestHandshake('Rooms', fields); 
                safeCloseModal('addRoomModal'); 
                await synchronizeLocalMetadataCachePools(); 
                showAdminSubTab('rooms');
                roomForm.reset();
            };
        }
    }
    
    // ----------------------------------------------------
    // SUB-TAB MODULE WRAPPER: INTRODUCERS PARTNERS CONTRACTS
    // ----------------------------------------------------
    else if (subTab === 'introducers') {
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Independent Intermediary Introducers Channel Registry</h5>
                <button class="btn btn-sm btn-success text-white fw-bold" onclick="safeOpenModal('addIntroModal')">+ Register Channel Partner</button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light"><tr><th>Full Legal Name</th><th>Calling Name</th><th>NIC Number Code Reference</th><th>Physical Residence Address</th></tr></thead>
                    <tbody id="lbl-admin-intro-list"></tbody>
                </table>
            </div>
        `;
        
        const listBody = document.getElementById('lbl-admin-intro-list');
        listBody.innerHTML = cacheIntroducers.map(i => `
            <tr class="animate-fade-in">
                <td>👤 <strong>${i.fields['Full Name']}</strong></td>
                <td>${i.fields['Calling Name'] || 'N/A'}</td>
                <td>${i.fields['NIC Number'] || 'N/A'}</td>
                <td><small class="text-secondary">${i.fields['Address'] || 'Not Stated'}</small></td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="text-center text-muted py-2">No commission partner vectors logged.</td></tr>';
        
        const introForm = document.getElementById('introForm');
        if (introForm) {
            introForm.onsubmit = async (e) => {
                e.preventDefault();
                const fields = { 
                    "Full Name": document.getElementById('adminIntroFullName').value.trim(), 
                    "Calling Name": document.getElementById('adminIntroFullName').value.trim().split(' ')[0], 
                    "NIC Number": document.getElementById('adminIntroNIC').value.trim(), 
                    "Address": document.getElementById('adminIntroAddress').value.trim() 
                };
                await dispatchPostRESTRequestHandshake('Introducers', fields); 
                safeCloseModal('addIntroModal'); 
                await synchronizeLocalMetadataCachePools(); 
                showAdminSubTab('introducers');
                introForm.reset();
            };
        }
    }
    
    // ----------------------------------------------------
    // SUB-TAB MODULE WRAPPER: DAY CLOSURE ADMINISTRATIVE REVERSALS
    // ----------------------------------------------------
    else if (subTab === 'rollback') {
        content.innerHTML = `
            <div class="p-3 border rounded bg-light border-danger animate-fade-in">
                <h6 class="fw-bold text-danger mb-2">🔓 Security Overrides Gate: Administrative Rollback Partition</h6>
                <p class="text-muted small">Only accounts holding high-level corporate Administrator or Owner credentials parameters can break active historical daily close constraint blocks to adjust logs errors.</p>
                <div class="row g-2 mb-3">
                    <div class="col-md-6"><label class="small fw-bold text-muted">Enter Master Administrative Verification PIN</label><input type="password" id="txtAdminSecPin" class="form-control form-control-sm" placeholder="••••"></div>
                </div>
                <button class="btn btn-sm btn-danger fw-bold" onclick="executeAdministrativeRollbackUnlockSecured()">Break Day Locks Parameters & Reopen Ledgers</button>
            </div>
        `;
    }
    
    // ----------------------------------------------------
    // SUB-TAB MODULE WRAPPER: DYNAMIC API CO-METADATA PROFILE PARAMETERS
    // ----------------------------------------------------
    else if (subTab === 'system') {
        const currentApiKey = (typeof AIRTABLE_API_KEY !== 'undefined') ? AIRTABLE_API_KEY : '';
        const currentBaseId = (typeof BASE_ID !== 'undefined') ? BASE_ID : '';
        
        content.innerHTML = `
            <h5 class="fw-bold text-success mb-1">System Core Parameter Handshake Endpoints</h5>
            <p class="text-muted small">Configurations saved locally inside browser cache arrays to drive silent background REST queries loops.</p><hr>
            <div class="mb-2"><label class="small fw-bold text-muted">Bearer Token Secret Key Reference</label><input type="password" id="sysApiKeyEdit" class="form-control form-control-sm" value="${currentApiKey}"></div>
            <div class="mb-3"><label class="small fw-bold text-muted">Airtable Base Identifier ID Reference</label><input type="text" id="sysBaseIdEdit" class="form-control form-control-sm" value="${currentBaseId}"></div>
            <hr>
            <h6 class="fw-bold text-success mb-2">Extended Corporate Document Branding Settings</h6>
            <div class="mb-2"><label class="small fw-bold text-muted">Company Legal Trade Name</label><input type="text" id="cfgCoName" class="form-control form-control-sm" value="${localStorage.getItem('co_name_override') || 'Isiwara Aura'}"></div>
            <div class="mb-2"><label class="small fw-bold text-muted">Printed Voucher Receipt Heading Name</label><input type="text" id="cfgCoPrintName" class="form-control form-control-sm" value="${localStorage.getItem('co_print_name') || 'Isiwara Aura Ayurveda'}"></div>
            <div class="mb-2"><label class="small fw-bold text-muted">Business Incorporation Registration Number (BR)</label><input type="text" id="cfgCoRegNo" class="form-control form-control-sm" value="${localStorage.getItem('co_reg_no') || 'BR-99214/WP'}"></div>
            <div class="mb-3"><label class="small fw-bold text-muted">Logo Source Image Address URL (src link)</label><input type="text" id="cfgCoLogoUrl" class="form-control form-control-sm" value="${localStorage.getItem('co_logo_src') || ''}"></div>
            <button class="btn btn-sm btn-primary mt-2 fw-bold" onclick="saveSystemSettingsFromAdmin()">Commit Parameters Overwrites</button>
        `;
    }
}

/**
 * Destroys credentials records permanently out from Airtable table rows indices.
 * @param {string} userRowId - Alpha-numeric record string hash identifier 
 */
async function revokeUserAccessAuthenticationRecord(userRowId) {
    if (!confirm("Confirm hard revocation of access permissions? Account record will delete permanently from user grid loops.")) return;
    try {
        if (typeof dispatchDeleteRESTRequestHandshake === 'function') {
            const success = await dispatchDeleteRESTRequestHandshake('Users', userRowId);
            if (success) {
                if (typeof triggerCustomSwalNotification === 'function') {
                    triggerCustomSwalNotification("Credentials Purged", "User authorization parameters wiped successfully.");
                }
                showAdminSubTab('users');
            }
        }
    } catch(err) { alert("Access violation: Execution intercept dropped deletion sequence."); }
}
