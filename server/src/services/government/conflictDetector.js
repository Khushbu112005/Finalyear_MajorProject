const TRUST_HIERARCHY = {
    "LEGISLATION": 6,
    "MINISTRY_PORTAL": 5,
    "central_government": 5,
    "STATE_PORTAL": 4,
    "state_government": 4,
    "AUTHORITY_NOTIF": 3,
    "official_authority": 3,
    "official_department": 3,
    "SECONDARY_TRUSTED": 2,
    "secondary": 2,
    "SECONDARY_UNTRUSTED": 1
};

const getTrustScore = (sourceType) => {
    return TRUST_HIERARCHY[sourceType] || 0;
};

const detectAndResolveConflicts = (service, sources = []) => {
    const conflicts = [];
    const warnings = [];

    if (sources.length <= 1) {
        return {
            hasConflict: false,
            conflicts: [],
            warnings: []
        };
    }

    // Let's check for specific field conflicts in the service.
    // In our model, we can have a meta-tracker of field sources, e.g. service.fieldSources = { fees: "source1", eligibility: "source2" }
    // Or for the demo, we check if the service has conflict metadata, or we compare the raw sources if the database provides them.
    // Let's implement a structural compare of rules, fees, and deadlines if they have source bindings.

    // 1. Fee conflicts
    // If the service has a mock conflicts field or if we simulate it based on multiple sources in the registry.
    // Let's check if the service record contains explicit conflict items, or if we dynamically detect discrepancies.
    // To make it fully functional and reliable, we'll design it to inspect the service's source records and compare them.
    
    // Let's simulate conflict detection by checking if the service has a `conflictSpecs` array, or we can check the sources
    // associated with the service and see if they have mismatching field declarations.
    // We will look at `service.officialSources` and see if they specify different values.
    // For seeding, we'll add a `conflictData` helper to the service document to represent raw values reported by each source.
    
    const conflictData = service.conflictData || null;
    if (!conflictData) {
        return {
            hasConflict: false,
            conflicts: [],
            warnings: []
        };
    }

    // conflictData format:
    // {
    //    fees: [ { sourceId: "src-1", value: "INR 100" }, { sourceId: "src-2", value: "Free" } ],
    //    eligibilityRules: [ { sourceId: "src-1", field: "annualIncome", value: 250000 }, { sourceId: "src-2", field: "annualIncome", value: 300000 } ]
    // }
    
    for (const field in conflictData) {
        const claims = conflictData[field];
        if (!Array.isArray(claims) || claims.length <= 1) continue;

        // Check if there is a discrepancy
        const firstValueStr = JSON.stringify(claims[0].value);
        const hasDiscrepancy = claims.some(c => JSON.stringify(c.value) !== firstValueStr);

        if (hasDiscrepancy) {
            // We have a conflict! Resolve it.
            let resolvedClaim = null;
            let highestTrust = -1;
            let newestDate = new Date(0);

            const details = [];

            for (const claim of claims) {
                const source = sources.find(s => s.sourceId === claim.sourceId);
                const sourceType = source ? source.sourceType : "SECONDARY_UNTRUSTED";
                const trustScore = getTrustScore(sourceType);
                const pubDate = source && source.publicationDate ? new Date(source.publicationDate) : new Date(0);

                details.push({
                    sourceId: claim.sourceId,
                    sourceTitle: source ? source.title : claim.sourceId,
                    sourceType,
                    trustScore,
                    value: claim.value,
                    publicationDate: pubDate
                });

                // Resolution logic:
                // 1. Higher trust score wins.
                // 2. If same trust score, newer publication date wins.
                if (trustScore > highestTrust) {
                    highestTrust = trustScore;
                    newestDate = pubDate;
                    resolvedClaim = claim;
                } else if (trustScore === highestTrust) {
                    if (pubDate > newestDate) {
                        newestDate = pubDate;
                        resolvedClaim = claim;
                    }
                }
            }

            conflicts.push({
                field,
                resolvedValue: resolvedClaim.value,
                resolvedSourceId: resolvedClaim.sourceId,
                resolvedSourceTitle: details.find(d => d.sourceId === resolvedClaim.sourceId).sourceTitle,
                details
            });

            warnings.push({
                code: "SOURCE_CONFLICT_DETECTED",
                message: `Conflicting values for '${field}' detected between sources. Resolved using trust hierarchy in favor of '${
                    details.find(d => d.sourceId === resolvedClaim.sourceId).sourceTitle
                }'.`
            });
        }
    }

    return {
        hasConflict: conflicts.length > 0,
        conflicts,
        warnings
    };
};

module.exports = {
    detectAndResolveConflicts,
    getTrustScore
};
