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
    createIntroducerRecord(bookingId, guestId, introducerName, packagePrice, commType, commValue) {
        let calculatedIncentiveAmount = 0;
        let auditLabelString = "";

        // Core Mathematical Resolution Routing
        if (commType === 'PCT') {
            const percentageFactor = parseFloat(commValue) / 100;
            calculatedIncentiveAmount = packagePrice * percentageFactor;
            auditLabelString = `${commValue}% Variable Percentage Split Model`;
        } else {
            // Default Fallback: Static Currency Allocation Value (LKR Rupee Mode)
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
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };

        console.log(`💸 Incentive Accounting Complete: Allocated ${auditLabelString} yielding Total Pay LKR: ${calculatedIncentiveAmount}`);

        // Safe Network Pipeline Dispatch Hook out to Cloud Data Registry
        if (typeof dispatchPostRESTRequestHandshake === 'function' && localStorage.getItem('BASE_ID')) {
            dispatchPostRESTRequestHandshake('IntroducerIncentives', {
                BookingId: bookingId,
                IntroducerName: introducerName,
                TotalPackagePrice: packagePrice,
                CalculatedIncentive: calculatedIncentiveAmount,
                DistributionModelContext: auditLabelString,
                Status: 'PENDING'
            }).catch(networkException => {
                console.error("Critical Cloud Transaction Abort dropped on Introducer Ledger Matrix sync:", networkException);
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
