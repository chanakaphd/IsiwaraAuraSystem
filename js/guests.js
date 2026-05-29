/**
 * Isiwara Aura - Guest Registry Profiles Index & Metadata Customizer
 */

/**
 * Fetches the raw client registry rows from Airtable and populates the directory data grid.
 */
async function fetchAndRenderGuestsView() {
    const tbody = document.getElementById('guest-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center font-monospace py-3 small">Parsing cloud historical directories grids...</td></tr>`;
    if (!AIRTABLE_API_KEY || !BASE_ID) return;

    try {
        // Query client profiles sorted alphabetically by Full Name
        const res = await fetchAirtableTableRecords('Guests?sort[0][field]=Full%20Name&sort[0][direction]=asc');
        
        tbody.innerHTML = (res || []).map(guest => {
            const f = guest.fields;
            const recordId = guest.id;
            const guestIdTag = f['Guest ID'] || 'IP';
            const guestFullName = f['Full Name'] || 'Anonymous Client';
            const guestCountry = f['Country'] || 'Sri Lanka';
            const guestPhone = f['Phone Number'] || 'N/A';
            const guestEmail = f['Email'] || 'N/A';
            const guestHotel = f['Hotel / Staying Place'] || 'Not Documented';

            return `
                <tr class="animate-fade-in">
                    <td><span class="badge bg-dark">${guestIdTag}</span></td>
                    <td><strong>${guestFullName}</strong></td>
                    <td>📍 ${guestCountry}</td>
                    <td>${guestPhone}</td>
                    <td><small>${guestEmail}</small></td>
                    <td><small class="text-secondary">${guestHotel}</small></td>
                    <td>
                        <button class="btn btn-xs btn-sm btn-outline-success fw-bold py-0" 
                                style="font-size:11px;" 
                                onclick="openEditGuestProfileModal('${recordId}', \`${guestFullName.replace(/'/g, "\\'")}\`, \`${guestCountry.replace(/'/g, "\\'")}\`, \`${guestPhone}\`, \`${guestEmail}\`, \`${guestHotel.replace(/'/g, "\\'")}\`)">
                            📝 Update Profile
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        if (res.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted">No client records found in database index.</td></tr>`;
        }
    } catch (ex) {
        console.error("Parsing exception error dropped inside guests rendering loop:", ex);
        tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center py-3">⚠️ Connection Refused: Failed to fetch client file strings maps.</td></tr>`;
    }
}

/**
 * Pre-populates form elements inside the profile modification pop-up canvas interface.
 * @param {string} id - Airtable Internal Record ID Row index hash 
 */
function openEditGuestProfileModal(id, name, country, phone, email, hotel) {
    document.getElementById('editGuestRecordId').value = id;
    document.getElementById('editGuestFullName').value = name;
    document.getElementById('editGuestPhone').value = phone;
    document.getElementById('editGuestEmail').value = email === 'N/A' ? '' : email;
    document.getElementById('editGuestHotel').value = hotel === 'Not Documented' ? '' : hotel;

    const countrySelect = document.getElementById('editGuestCountrySelect');
    if (countrySelect && typeof globalCountriesList !== 'undefined') {
        // Hydrate dropdown menu strictly using global data definitions array from config.js
        countrySelect.innerHTML = globalCountriesList.map(c => 
            `<option value="${c.name}">${c.name} (${c.code})</option>`
        ).join('');
        
        countrySelect.value = country || "Sri Lanka";
    }

    if (typeof safeOpenModal === 'function') {
        safeOpenModal('editGuestModal');
    }
}

/**
 * Event-driven trigger mapping to alter the phone dialing prefix code immediately when country choices drop down moves.
 */
function patchGuestCountryDialCodeMapping() {
    const countrySelect = document.getElementById('editGuestCountrySelect');
    const phoneInput = document.getElementById('editGuestPhone');
    if (!countrySelect || !phoneInput || typeof globalCountriesList === 'undefined') return;

    const matchedCountry = globalCountriesList.find(x => x.name === countrySelect.value);
    if (matchedCountry) {
        phoneInput.value = matchedCountry.code + " ";
        phoneInput.focus();
    }
}

/**
 * Intercepts submission loops to patch client parameters records live down to Airtable REST API pipelines.
 */
if (document.getElementById('editGuestForm')) {
    document.getElementById('editGuestForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const recordId = document.getElementById('editGuestRecordId').value;
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerText = "Syncing Changes...";
        }

        const updatedFields = {
            "Full Name": document.getElementById('editGuestFullName').value.trim(),
            "Country": document.getElementById('editGuestCountrySelect').value,
            "Phone Number": document.getElementById('editGuestPhone').value.trim(),
            "Email": document.getElementById('editGuestEmail').value.trim() || "N/A",
            "Hotel / Staying Place": document.getElementById('editGuestHotel').value.trim() || "Not Documented"
        };

        try {
            if (typeof dispatchPatchRESTRequestHandshake === 'function') {
                await dispatchPatchRESTRequestHandshake('Guests', recordId, updatedFields);
            }
            
            if (typeof safeCloseModal === 'function') {
                safeCloseModal('editGuestModal');
            }
            
            if (typeof triggerCustomSwalNotification === 'function') {
                triggerCustomSwalNotification("Registry Document Overwritten", "Client profile meta datasets altered successfully.");
            }
            
            // Refresh tables matrix logs view immediately
            fetchAndRenderGuestsView();
        } catch (error) {
            console.error("Failed to push profile update down to server:", error);
            alert("Database Error: Access violation parameters dropped modification request pipeline.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerText = "Commit Changes Profile";
            }
        }
    });
}
