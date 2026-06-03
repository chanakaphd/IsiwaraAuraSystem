/**
 * js/airtable.js
 * Global Service Transport Core Driver Module
 */

async function dispatchSecureAirtableNetworkRequest(endpointTablePath, HTTPMethod = 'GET', dataBodyPayload = null) {
    const keyPAT = localStorage.getItem('AIRTABLE_API_KEY');
    const identificationBaseID = localStorage.getItem('BASE_ID');

    if (!keyPAT || !identificationBaseID) {
        console.warn("⚠️ Core API Configuration Error: Local credentials missing. Route aborted.");
        return null;
    }

    const universalRequestURL = `https://api.airtable.com/v0/${identificationBaseID}/${encodeURIComponent(endpointTablePath)}`;
    
    const configurationHeaders = {
        'Authorization': `Bearer ${keyPAT}`,
        'Content-Type': 'application/json'
    };

    let initializationObject = {
        method: HTTPMethod,
        headers: configurationHeaders
    };
    if (dataBodyPayload) initializationObject.body = JSON.stringify(dataBodyPayload);

    let serverNetworkResponse = null;
    let retryExecutionAttempt = 1;
    const maxRetryThreshold = 4;

    while (retryExecutionAttempt <= maxRetryThreshold) {
        try {
            serverNetworkResponse = await fetch(universalRequestURL, initializationObject);
            
            if (serverNetworkResponse.status === 429) {
                // Exponential Backoff algorithm parsing path [5 requests per second limits]
                const deliberateWaitTimeoutPeriod = Math.pow(2, retryExecutionAttempt) * 1000;
                console.warn(`[Airtable Throttling] Rate Limit (429) hit. Retrying in ${deliberWaitTimeoutPeriod}ms...`);
                await new Promise(resolve => setTimeout(resolve, deliberateWaitTimeoutPeriod));
                retryExecutionAttempt++;
                continue;
            }

            if (!serverNetworkResponse.ok) {
                const faultLogResponseError = await serverNetworkResponse.json();
                console.error(`❌ Cloud Data Exception [${serverNetworkResponse.status}]:`, faultLogResponseError);
                return null;
            }

            return await serverNetworkResponse.json();

        } catch (networkExceptionError) {
            console.error("❌ Fatal Connection Handshake Interruption Error:", networkExceptionError);
            return null;
        }
    }
    return null;
}

/**
 * Universal database read interface extraction node with basic pagination wrapping features
 */
async function fetchAirtableTableRecords(targetSchemaTableName) {
    let collectionAccumulatorRecords = [];
    let transactionPaginationOffsetToken = null;

    do {
        let endpointStringQueryURL = targetSchemaTableName;
        if (transactionPaginationOffsetToken) {
            endpointStringQueryURL += `?offset=${transactionPaginationOffsetToken}`;
        }

        const standardJSONResponsePayload = await dispatchSecureAirtableNetworkRequest(endpointStringQueryURL, 'GET');
        
        if (standardJSONResponsePayload && standardJSONResponsePayload.records) {
            collectionAccumulatorRecords = collectionAccumulatorRecords.concat(standardJSONResponsePayload.records);
            transactionPaginationOffsetToken = standardJSONResponsePayload.offset || null;
        } else {
            transactionPaginationOffsetToken = null; // Kill transmission sequence loops on empty records return arrays
        }
    } while (transactionPaginationOffsetToken);

    return collectionAccumulatorRecords;
}

/**
 * Single object item creation record posting dispatcher node
 */
async function dispatchPostRESTRequestHandshake(targetSchemaTableName, itemFieldsPayload) {
    const transactionRecordEnvelopeBody = { fields: itemFieldsPayload };
    return await dispatchSecureAirtableNetworkRequest(targetSchemaTableName, 'POST', transactionRecordEnvelopeBody);
}
