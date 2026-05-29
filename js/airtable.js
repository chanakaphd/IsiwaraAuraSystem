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
 * Helper function executing clean GET requests against specific Airtable tables
 * @param {string} tableName - Target base sheet name string
 * @returns {Array} Array of Airtable record objects
 */
async function fetchAirtableTableRecords(tableName) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`;
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
        const data = await response.json();
        return data.records || [];
    } catch (err) {
        console.error(`Fetch routine dropped on table index [${tableName}]:`, err);
        return [];
    }
}

/**
 * Global Airtable API Async REST Request Handler
 * Dispatches secure headers out to cloud table endpoints
 * @param {string} tableWithParams - Target table name and optional query syntax strings
 * @returns {Array} Extracted row records array from server response
 */
async function fetchAirtableTableRecords(tableWithParams) {
    if (!AIRTABLE_API_KEY || !BASE_ID) {
        console.warn("API Execution Halted: Configuration parameters are incomplete.");
        return [];
    }

    const endpointUrl = `https://api.airtable.com/v0/${BASE_ID}/${tableWithParams}`;
    
    try {
        const response = await fetch(endpointUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`Airtable Server Rejected Request [${response.status}]:`, errorDetails);
            throw new Error(`Network response error: ${response.status}`);
        }

        const dataPayload = await response.json();
        return dataPayload.records || [];

    } catch (networkError) {
        console.error(`Critical fetch exception dropped on [${tableWithParams}]:`, networkError);
        throw networkError;
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
