const GovernmentSource = require("../../models/GovernmentSource");

/**
 * Verifies if a given URL and sourceId belong to an active, verified source in the registry.
 * @param {string} sourceId - The unique source ID.
 * @param {string} url - Optional URL to match. If omitted, returns the verified URL for the source.
 * @returns {Promise<string|null>} - The verified URL if successful, otherwise null.
 */
const verifyOfficialUrl = async (sourceId, url = null) => {
    if (!sourceId) return null;

    try {
        let source;
        if (global.useDbFallback) {
            const localDb = require("./localDbFallback");
            source = localDb.findSourceById(sourceId);
        } else {
            source = await GovernmentSource.findOne({ sourceId });
        }
        
        if (!source) {
            console.warn(`URL Verification Failed: Source '${sourceId}' not found.`);
            return null;
        }

        // Must be verified and active
        if (!source.verified || source.verificationStatus !== "ACTIVE") {
            console.warn(`URL Verification Failed: Source '${sourceId}' is unverified or not active.`);
            return null;
        }

        const officialUrl = source.officialUrl || source.url;

        // If a specific URL was passed to verify, validate it against the registered URL.
        if (url) {
            const normUrl = url.trim().replace(/\/+$/, "").toLowerCase();
            const normOffUrl = officialUrl.trim().replace(/\/+$/, "").toLowerCase();
            
            if (normUrl === normOffUrl) {
                return officialUrl;
            }
            console.warn(`URL Verification Failed: Mismatch for source '${sourceId}'. Provided: ${url}, Expected: ${officialUrl}`);
            return null;
        }

        return officialUrl;
    } catch (error) {
        console.error("URL Verification Error:", error.message);
        return null;
    }
};

module.exports = {
    verifyOfficialUrl
};
