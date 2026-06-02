/**
 * Isiwara Aura - Airtable REST API Synchronization Engine
 */

// Cache variable specifically assigned for user validation tracking inside auth.js
let cacheUsersPool = [];

/**
 * Synchronizes all structural reference metadata pools from Airtable tables live.
 * This ensures drop-downs always reflect the true, un-cached state of data tables.
 */
async function synchronizeLocalMetadataCachePools() {
    if (!AIRTABLE_API_KEY || !BASE_ID) {
        console.warn("Airtable endpoint credentials missing. System operating in standalone proxy sandbox layout.");
        return;
    }

    try {
        // Asynchronously fetch raw row collections from all infrastructure reference sheets
        const [roomsResponse, treatmentsResponse, therapistsResponse, introducersResponse, rolesResponse, usersResponse] = await Promise.all([
            fetchAirtableTableRecords('Rooms'),
            fetchAirtableTableRecords('Treatments'),
            fetchAirtableTableRecords('Therapists'),
            fetchAirtableTableRecords('Introducers'),
            fetchAirtableTableRecords('Roles'),
            fetchAirtableTableRecords('Users')
        ]);

        // Overwrite global application cache scopes defined inside config.js
        cacheRooms = roomsResponse || [];
        cacheTreatments = treatmentsResponse || [];
        cacheTherapists = therapistsResponse || [];
        cacheIntroducers = introducersResponse || [];
        cacheRoles = rolesResponse || [];
        cacheUsersPool = usersResponse || [];

        console.log("🔄 Global Airtable Metadata Caches synchronized safely.");
    } catch (error) {
        console.error("Critical API Handshake drop encountered during data caching loop:", error);
    }
}

/**
 * Global Airtable API Async REST Request Handler
 * Dispatches secure headers out to cloud table endpoints
 * @param {string} tableWithParams - Target table name and optional query syntax strings
 * @returns {Array} Extracted row records array from server response
 */
/**
 * Isiwara Aura - Global Service Transport Layer
 * Standardized network protocol interface using dynamically scoped local storage keys.
 */

/**
 * Universally retrieves a clean data payload string array from a target Airtable table.
 */
async function fetchAirtableTableRecords(tableName) {
    const baseId = localStorage.getItem('BASE_ID');
    const apiKey = localStorage.getItem('AIRTABLE_API_KEY');

    if (!baseId || !apiKey || baseId === 'undefined' || apiKey === 'undefined') {
        console.error(`❌ Transport Blocked [GET]: Missing parameters for table: ${tableName}`);
        return [];
    }

    // Encodes spaces cleanly (e.g., 'Financial Ledger' -> 'Financial%20Ledger') without double-encoding
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error(`❌ Server Error [${response.status}] for ${tableName}:`, errData);
            return [];
        }

        const data = await response.json();
        return data.records || [];
    } catch (networkError) {
        console.error(`❌ Connection Failure reaching table ${tableName}:`, networkError);
        return [];
    }
}

/**
 * Dispatches a single object dataset record insertion cleanly into the host schema.
 */
async function dispatchPostRESTRequestHandshake(tableName, payloadFields) {
    const baseId = localStorage.getItem('BASE_ID');
    const apiKey = localStorage.getItem('AIRTABLE_API_KEY');

    if (!baseId || !apiKey || baseId === 'undefined' || apiKey === 'undefined') {
        console.error(`❌ Transport Blocked [POST]: Missing credentials for table: ${tableName}`);
        return { error: { message: "Local credentials configuration missing." } };
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: payloadFields })
        });

        const resultData = await response.json();
        return resultData;
    } catch (networkError) {
        console.error(`❌ Post Transmission Crash on table ${tableName}:`, networkError);
        return { error: { message: networkError.message } };
    }
}
/**
 * Executes a partial PATCH request to mutate parameters of an existing row.
 * Used for updating introducer disbursements, rolling back day-locks, and patching guest records.
 * @param {string} tableName - Target table index matching system keys string
 * @param {string} recordId - Target Airtable alpha-numeric internal unique record ID string
 * @param {Object} fieldsDataMap - Fields map holding values blocks to overwrite
 * @returns {Object} Mutated transaction result object framework map
 */
async function dispatchPatchRESTRequestHandshake(tableName, recordId, fieldsDataMap) {
    if (!AIRTABLE_API_KEY || !BASE_ID) {
        console.warn(`Local Proxy Simulation Overwrite patch processed for table field lines: [${tableName}]`);
        return { id: recordId, fields: fieldsDataMap };
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`;
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: fieldsDataMap })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`PATCH exception thrown with status ${response.status}: ${errBody}`);
        }

        return await response.json();
    } catch (ex) {
        console.error(`REST field alteration thread dropped on target record ID [${recordId}] inside [${tableName}]:`, ex);
        throw ex;
    }
}

/**
 * Global Airtable API Async REST POST Request Handler
 * Packages raw field records and commits them securely to cloud tables
 * @param {string} tableName - Target base table sheet name
 * @param {Object} fieldsDataMap - Key-value pair payload map matching Airtable columns
 * @returns {Object|null} The committed Airtable record object or null on failure
 */
async function dispatchPostRESTRequestHandshake(tableName, fieldsDataMap) {
    if (!AIRTABLE_API_KEY || !BASE_ID) {
        console.warn(`Local Proxy Simulation: POST request bypassed for table [${tableName}]`);
        return null;
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: fieldsDataMap })
        });

        if (!response.ok) {
            const errDetails = await response.text();
            console.error(`Airtable Server Rejected POST [${response.status}]:`, errDetails);
            alert(`Database Error [${response.status}]: Server rejected entry commitment.`);
            return null;
        }

        const standardResult = await response.json();
        console.log(`✅ Record successfully committed to Airtable table [${tableName}]:`, standardResult.id);
        
        if (typeof triggerCustomSwalNotification === 'function') {
            triggerCustomSwalNotification("Record Saved!", `Successfully committed new entry to ${tableName}.`);
        } else {
            alert(`Success!\nNew record successfully saved into the ${tableName} matrix.`);
        }

        return standardResult;

    } catch (networkError) {
        console.error(`Critical exception dropped during POST handshake on [${tableName}]:`, networkError);
        alert("Network Timeout: Communication with Airtable data streams broken.");
        return null;
    }
}

/**
 * Atomic DELETE tracking handle to remove user records inside administration panels frames.
 * @param {string} tableName - Target Airtable base sheet name
 * @param {string} recordId - Alpha-numeric structural record sequence ID string
 */
async function dispatchDeleteRESTRequestHandshake(tableName, recordId) {
    if (!AIRTABLE_API_KEY || !BASE_ID) return true;
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        return response.ok;
    } catch (err) {
        console.error(`DELETE mutation request rejected on row element reference [${recordId}]:`, err);
        return false;
    }
}
