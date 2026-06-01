/**
 * Isiwara Aura - Advanced Introducer Incentive Accounting Engine
 */

class DynamicIntroducerIncentiveEngine {
    /**
     * Create Introducer Record with Dynamic Split Logic Matrix
     * @param {string} bookingId - Target transaction verification code signature
     * @param {string} guestId - Guest identifier key
     * @param {string} introducerName - Partner corporate profile lookup name
     * @param {number} packagePrice - Base total value transacted for services
     * @param {string} commType - Dropdown valuation flag ('LKR' or 'PCT')
     * @param {number} commValue - Numerical split value passed from data form entry
     */
    async createIntroducerRecord(bookingId, guestId, introducerName, packagePrice, commType, commValue) {
        let calculatedIncentiveAmount = 0;
        let auditLabelString = "";

        if (commType === 'PCT') {
            const percentageFactor = parseFloat(commValue) / 100;
            calculatedIncentiveAmount = packagePrice * percentageFactor;
            auditLabelString = `${commValue}% Variable Percentage Split Model`;
        } else {
            calculatedIncentiveAmount = parseFloat(commValue);
            auditLabelString = `රු. ${calculatedIncentiveAmount.toLocaleString()} Fixed Flat Rate Split Model`;
        }

        const introducerLedgerRecord = {
            bookingId: bookingId,
            guestId: guestId,
            introducerName: introducerName,
            packagePrice: packagePrice,
            incentiveAmount: calculatedIncentiveAmount,
            calculationAuditLog: auditLabelString,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        console.log(`💸 Incentive Accounting Complete: Allocated ${auditLabelString}`);

        // Resolve text name to Airtable record ID
        let resolvedIntroducerRecordId = null;
        if (typeof cacheIntroducers !== 'undefined' && cacheIntroducers.length > 0) {
            const matchedIntroObj = cacheIntroducers.find(i => i.fields['Full Name'] === introducerName);
            if (matchedIntroObj) resolvedIntroducerRecordId = matchedIntroObj.id; 
        }

        // Direct mapping to your physical Commissions Ledger schema columns
        if (typeof dispatchPostRESTRequestHandshake === 'function' && resolvedIntroducerRecordId) {
            
            // Core database schema field alignment block
            const commissionsPayload = {
                "Total Volume Base": packagePrice,
                "Commission Percentage": parseInt(commValue, 10) || 0, // Maps to Integer
                "Payout Status": "Pending",
                "Introducer Link": [resolvedIntroducerRecordId] // Maps to Link to Introducers array
            };

            // Safely background logs into the table
            dispatchPostRESTRequestHandshake('Commissions Ledger', commissionsPayload)
                .catch(networkException => {
                    console.error("Cloud Transaction Abort dropped on Introducer Ledger sync:", networkException);
                });
        }

        return introducerLedgerRecord;
    }

    generateIntroducerReceipt(record) {
        return {
            title: 'CORPORATE CHANNEL PARTNER INCENTIVE REVENUE VOUCHER',
            timestamp: new Date().toISOString(),
            voucherId: `INT-VOUCH-${record.bookingId}`,
            partnerSignature: record.introducerName,
            grossVolumeTransacted: record.packagePrice,
            appliedDistributionRule: record.calculationAuditLog,
            netPayableIncentiveLKR: record.incentiveAmount,
            status: record.status
        };
    }
}

// Global scope export initialization sequence alignment
window.introducerIncentiveEngine = new DynamicIntroducerIncentiveEngine();
