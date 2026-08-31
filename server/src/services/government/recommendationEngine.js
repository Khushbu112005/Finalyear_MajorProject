const { checkEligibility } = require("./eligibilityEngine");
const GovernmentSource = require("../../models/GovernmentSource");

const WEIGHTS = {
    problemRelevance: 0.35,
    eligibilityCompatibility: 0.30,
    jurisdictionMatch: 0.15,
    sourceReliability: 0.05,
    sourceFreshness: 0.10,
    procedureCompleteness: 0.05
};

const calculateJurisdictionMatch = (service, citizenContext = {}) => {
    const { jurisdiction, state: serviceState, district: serviceDistrict } = service;
    const { state: userState, district: userDistrict } = citizenContext;

    const hasUserState = Boolean(userState && String(userState).trim());

    if (jurisdiction === "central" || jurisdiction === "All") {
        // Nationwide services are valid everywhere, but when a citizen explicitly specifies their state,
        // a matching state-specific service provides higher jurisdiction specificity.
        return hasUserState ? 0.85 : 1.0;
    }

    if (jurisdiction === "state") {
        if (!hasUserState) return 0.5; // Citizen state unknown
        return String(userState).trim().toLowerCase() === String(serviceState || "").trim().toLowerCase() ? 1.0 : 0.0;
    }

    if (jurisdiction === "district") {
        if (!hasUserState) return 0.0;
        if (String(userState).trim().toLowerCase() !== String(serviceState || "").trim().toLowerCase()) return 0.0;
        
        if (!userDistrict || !String(userDistrict).trim()) return 0.90; // State match, district unknown
        return String(userDistrict).trim().toLowerCase() === String(serviceDistrict || "").trim().toLowerCase() ? 1.0 : 0.0;
    }

    return 0.5;
};

const calculateEligibilityCompatibility = (eligibilityResult) => {
    const { status, confirmed, failed, unknown } = eligibilityResult;
    if (status === "FAILED") return 0.0;
    if (status === "CONFIRMED") return 1.0;
    
    // Status is UNKNOWN (Likely). Calculate ratio of confirmed rules.
    const total = confirmed.length + unknown.length;
    if (total === 0) return 1.0;
    return (confirmed.length + 0.75 * unknown.length) / total;
};

const getSourceReliability = (sourceType) => {
    switch (sourceType) {
        case "LEGISLATION":
            return 1.0;
        case "MINISTRY_PORTAL":
            return 0.95;
        case "STATE_PORTAL":
            return 0.90;
        case "AUTHORITY_NOTIF":
            return 0.85;
        case "SECONDARY_TRUSTED":
            return 0.70;
        case "SECONDARY_UNTRUSTED":
            return 0.30;
        case "central_government":
            return 0.95;
        case "state_government":
            return 0.90;
        case "official_department":
            return 0.85;
        case "official_authority":
            return 0.85;
        case "secondary":
            return 0.50;
        default:
            return 0.50;
    }
};

const calculateSourceReliability = async (service) => {
    const sourceIds = service.officialSources || [];
    if (sourceIds.length === 0) {
        if (service.sources && service.sources.length > 0) {
            const types = service.sources.map(s => getSourceReliability(s.sourceType));
            return Math.max(...types);
        }
        return 0.5;
    }

    try {
        let sources;
        if (global.useDbFallback) {
            const localDb = require("./localDbFallback");
            sources = localDb.findSources({ sourceId: { $in: sourceIds } });
        } else {
            sources = await GovernmentSource.find({ sourceId: { $in: sourceIds } });
        }

        if (sources.length === 0) return 0.5;

        const reliabilities = sources.map(src => getSourceReliability(src.sourceType));
        return Math.max(...reliabilities);
    } catch (error) {
        return 0.5;
    }
};

const calculateSourceFreshness = (service) => {
    const lastVerified = service.lastVerified;
    if (!lastVerified) return 0.5;

    const diffTime = Math.abs(new Date() - new Date(lastVerified));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 90) return 1.0;
    if (diffDays <= 180) return 0.8;
    if (diffDays <= 365) return 0.5;
    return 0.2;
};

const calculateProcedureCompleteness = (service) => {
    const steps = service.procedureSteps || [];
    if (steps.length === 0) return 0.0;
    return Math.min(steps.length / 5, 1.0);
};

const rankServices = async (services, query = "", citizenContext = {}) => {
    const ranked = [];

    for (const service of services) {
        let problemRelevance = 1.0;
        if (query) {
            if (service._doc && service._doc.score !== undefined) {
                problemRelevance = Math.min(service._doc.score / 3, 1.0);
            } else {
                const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                if (queryWords.length > 0) {
                    const content = `${service.serviceName} ${service.description} ${(service.keywords || []).join(" ")}`.toLowerCase();
                    const matches = queryWords.filter(word => content.includes(word));
                    problemRelevance = matches.length / queryWords.length;
                }
            }
        }

        const jurisdictionMatch = calculateJurisdictionMatch(service, citizenContext);
        const eligibilityResult = checkEligibility(service.eligibilityRules, citizenContext);
        const eligibilityCompatibility = calculateEligibilityCompatibility(eligibilityResult);
        const sourceReliability = await calculateSourceReliability(service);
        const sourceFreshness = calculateSourceFreshness(service);
        const procedureCompleteness = calculateProcedureCompleteness(service);

        const components = {
            problemRelevance,
            jurisdictionMatch,
            eligibilityCompatibility,
            sourceReliability,
            sourceFreshness,
            procedureCompleteness
        };

        let overallScore = 0;
        for (const key in WEIGHTS) {
            overallScore += (components[key] || 0) * WEIGHTS[key];
        }

        overallScore = Math.round(overallScore * 100) / 100;

        ranked.push({
            service,
            overallScore,
            components,
            eligibility: eligibilityResult
        });
    }

    return ranked.sort((a, b) => b.overallScore - a.overallScore);
};

module.exports = {
    rankServices,
    calculateJurisdictionMatch,
    calculateEligibilityCompatibility,
    calculateSourceReliability,
    calculateSourceFreshness,
    calculateProcedureCompleteness,
    WEIGHTS
};
