const GovernmentService = require("../models/GovernmentService");
const GovernmentSource = require("../models/GovernmentSource");
const mongoose = require("mongoose");
const { checkEligibility } = require("../services/government/eligibilityEngine");
const { rankServices } = require("../services/government/recommendationEngine");
const { detectMissingInformation } = require("../services/government/missingInfoEngine");
const { detectAndResolveConflicts } = require("../services/government/conflictDetector");
const { verifyOfficialUrl } = require("../services/government/urlVerifier");
const { analyzeProblem, generateExplanation } = require("../services/government/aiService");

const findServiceByIdentifier = async (id) => {
    if (mongoose.isValidObjectId(id)) {
        const byObjectId = await GovernmentService.findById(id);
        if (byObjectId) return byObjectId;
    }
    return GovernmentService.findOne({ serviceId: id });
};

// Helper to structure all successful responses
const sendSuccess = (req, res, status, data, extra = {}) => {
    return res.status(status).json({
        success: true,
        request_id: req.request_id || "dev-req",
        data,
        sources: extra.sources || [],
        confidence: extra.confidence !== undefined ? extra.confidence : 1.0,
        warnings: extra.warnings || [],
        timestamp: new Date().toISOString()
    });
};

// Helper to structure error responses securely (no stack traces)
const sendError = (req, res, status, code, message) => {
    return res.status(status).json({
        success: false,
        request_id: req.request_id || "dev-req",
        error: {
            code,
            message
        }
    });
};

// ======================================================
// GET ALL GOVERNMENT SERVICES (WITH FILTER & PAGINATION)
// ======================================================
const getAllServices = async (req, res) => {
    try {
        const { state, category, department, serviceType, page = 1, limit = 10 } = req.query;
        
        const filter = {
            verificationStatus: { $ne: "BLOCKED" }
        };

        if (state) {
            filter.$or = [
                { state: state },
                { jurisdiction: "central" },
                { jurisdiction: "All" }
            ];
        }
        if (category) {
            filter.categories = { $in: [category] };
        }
        if (department) {
            filter.department = department;
        }
        if (serviceType) {
            filter.serviceType = serviceType;
        }

        const skip = (Number(page) - 1) * Number(limit);
        
        let services;
        let total;

        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            services = localDb.findServices(filter);
            total = services.length;
            services = services.slice(skip, skip + Number(limit));
        } else {
            services = await GovernmentService.find(filter)
                .sort({ serviceName: 1 })
                .skip(skip)
                .limit(Number(limit));
            total = await GovernmentService.countDocuments(filter);
        }

        return sendSuccess(req, res, 200, {
            services,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error("GET All Services Error:", error.message);
        return sendError(req, res, 500, "SERVICE_FETCH_ERROR", "Unable to retrieve services.");
    }
};

// ======================================================
// GET SERVICE BY ID (WITH CONFLICT DETECTION)
// ======================================================
const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        let service;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            service = localDb.findServiceById(id);
        } else {
            service = await findServiceByIdentifier(id);
        }

        if (!service || service.verificationStatus === "BLOCKED") {
            return sendError(req, res, 404, "SERVICE_NOT_FOUND", "Government service not found.");
        }

        const sourceIds = service.officialSources || [];
        
        let sources;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            sources = localDb.findSources({ sourceId: { $in: sourceIds } });
        } else {
            sources = await GovernmentSource.find({ sourceId: { $in: sourceIds } });
        }

        const conflictResult = detectAndResolveConflicts(service, sources);

        // Map resolved officialPortal URL securely
        if (service.officialPortal && service.officialPortal.url) {
            const verifiedUrl = await verifyOfficialUrl(service.officialSources[0]);
            if (verifiedUrl) {
                service.officialPortal.url = verifiedUrl;
                service.officialPortal.verified = true;
            } else {
                service.officialPortal.verified = false;
                service.officialPortal.url = null;
            }
        }

        const confidence = service.confidence || 0.5;

        return sendSuccess(req, res, 200, {
            service,
            conflicts: conflictResult.conflicts
        }, {
            sources,
            confidence,
            warnings: conflictResult.warnings
        });
    } catch (error) {
        console.error("GET Service By ID Error:", error.message);
        return sendError(req, res, 500, "SERVICE_FETCH_ERROR", "Unable to retrieve service details.");
    }
};

// ======================================================
// INTENT SEARCH / RECOMMENDATION PIPELINE
// ======================================================
const recommendServices = async (req, res) => {
    try {
        const { problem, citizenContext = {} } = req.body;

        if (!problem) {
            return sendError(req, res, 400, "INVALID_INPUT", "A description of your problem is required.");
        }

        const analysis = await analyzeProblem(problem);
        
        const activeContext = {
            ...analysis.inferredContext,
            ...citizenContext
        };

        const filter = {
            verificationStatus: { $ne: "BLOCKED" }
        };

        if (analysis.category && analysis.category !== "General") {
            filter.categories = { $in: [analysis.category] };
        }

        const targetState = activeContext.state || analysis.state;
        if (targetState) {
            filter.$or = [
                { state: targetState },
                { jurisdiction: "central" },
                { jurisdiction: "All" }
            ];
        }

        let candidates;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            candidates = localDb.findServices(filter);
        } else {
            candidates = await GovernmentService.find(filter);
        }

        if (candidates.length === 0 && analysis.keywords.length > 0) {
            if (global.useDbFallback) {
                const localDb = require("../services/government/localDbFallback");
                candidates = localDb.localServices.filter(s => {
                    const content = `${s.serviceName} ${s.description} ${s.keywords.join(" ")}`.toLowerCase();
                    return analysis.keywords.some(kw => content.includes(kw.toLowerCase()));
                });
            } else {
                const regexKeywords = analysis.keywords.map(kw => new RegExp(kw, "i"));
                candidates = await GovernmentService.find({
                    verificationStatus: { $ne: "BLOCKED" },
                    $or: [
                        { serviceName: { $in: regexKeywords } },
                        { keywords: { $in: regexKeywords } }
                    ]
                });
            }
        }

        const rankedCandidates = await rankServices(candidates, problem, activeContext);
        const clarification = detectMissingInformation(rankedCandidates, activeContext);

        const responseList = [];
        for (const item of rankedCandidates.slice(0, 5)) {
            const relevanceReason = await generateExplanation(item.service, activeContext);
            
            let secureUrl = null;
            if (item.service.officialSources && item.service.officialSources.length > 0) {
                secureUrl = await verifyOfficialUrl(item.service.officialSources[0]);
            }

            responseList.push({
                serviceId: item.service.serviceId,
                serviceName: item.service.serviceName,
                department: item.service.department,
                ministry: item.service.ministry,
                jurisdiction: item.service.jurisdiction,
                state: item.service.state,
                overallScore: item.overallScore,
                components: item.components,
                relevanceExplanation: relevanceReason,
                eligibilityStatus: item.eligibility.status,
                eligibilityRulesSummary: {
                    confirmed: item.eligibility.confirmed.map(c => c.description || c.field),
                    failed: item.eligibility.failed.map(f => f.description || f.field),
                    unknown: item.eligibility.unknown.map(u => u.description || u.field)
                },
                officialPortal: {
                    title: item.service.officialPortal?.title || "Official Portal",
                    url: secureUrl,
                    verified: !!secureUrl
                },
                lastVerified: item.service.lastVerified,
                confidence: item.service.confidence
            });
        }

        const avgConfidence = responseList.length > 0 
            ? responseList.reduce((acc, curr) => acc + (curr.confidence || 0.5), 0) / responseList.length
            : 1.0;

        // Propagate a general warning if we are in fallback mode
        const warnings = [];
        if (global.useDbFallback) {
            warnings.push({
                code: "DATABASE_FALLBACK_ACTIVE",
                message: "MongoDB connection failed. Operating in local in-memory fallback database mode."
            });
        }

        return sendSuccess(req, res, 200, {
            interpretation: analysis.explanation,
            category: analysis.category,
            detectedState: targetState,
            needsClarification: clarification.needsClarification,
            questions: clarification.questions,
            recommendations: responseList,
            userContext: activeContext
        }, {
            confidence: avgConfidence,
            warnings
        });

    } catch (error) {
        console.error("Recommendation Engine Error:", error.stack);
        return sendError(req, res, 500, "RECOMMENDATION_ERROR", "Recommendation pipeline failed.");
    }
};

// ======================================================
// CLARIFICATION CONTEXT MERGING PIPELINE
// ======================================================
const processClarification = async (req, res) => {
    try {
        const { problem, citizenContext = {}, answers = {} } = req.body;

        const updatedContext = {
            ...citizenContext,
            ...answers
        };

        req.body.citizenContext = updatedContext;
        return recommendServices(req, res);
    } catch (error) {
        console.error("Clarification Process Error:", error.message);
        return sendError(req, res, 500, "CLARIFY_ERROR", "Clarification mapping failed.");
    }
};

// ======================================================
// EVALUATE ELIGIBILITY OF CITIZEN (DETERMINISTIC RULES)
// ======================================================
const checkServiceEligibilityApi = async (req, res) => {
    try {
        const { id } = req.params;
        const citizenContext = req.body.citizenContext || req.body;

        let service;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            service = localDb.findServiceById(id);
        } else {
            service = await findServiceByIdentifier(id);
        }

        if (!service) {
            return sendError(req, res, 404, "SERVICE_NOT_FOUND", "Government service not found.");
        }

        const checkResult = checkEligibility(service.eligibilityRules, citizenContext);
        
        return sendSuccess(req, res, 200, {
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            eligibility: checkResult
        });
    } catch (error) {
        return sendError(req, res, 500, "ELIGIBILITY_ERROR", "Eligibility logic failed.");
    }
};

// ======================================================
// DOCUMENT READINESS EVALUATION API
// ======================================================
const getDocumentReadiness = async (req, res) => {
    try {
        const { id } = req.params;
        const { availableDocuments = [] } = req.query;

        let service;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            service = localDb.findServiceById(id);
        } else {
            service = await findServiceByIdentifier(id);
        }

        if (!service) {
            return sendError(req, res, 404, "SERVICE_NOT_FOUND", "Service not found.");
        }

        let citizenDocs = Array.isArray(availableDocuments) 
            ? availableDocuments 
            : String(availableDocuments).split(",").map(d => d.trim()).filter(Boolean);

        const requiredDocs = service.requiredDocuments || [];
        const ready = [];
        const missing = [];
        const unknown = [];

        for (const doc of requiredDocs) {
            const hasDoc = citizenDocs.some(cd => 
                cd.toLowerCase().includes(doc.documentId.toLowerCase()) || 
                cd.toLowerCase().includes(doc.documentName.toLowerCase()) ||
                (doc.name && cd.toLowerCase().includes(doc.name.toLowerCase()))
            );

            const docItem = {
                documentId: doc.documentId,
                documentName: doc.documentName,
                isMandatory: doc.isMandatory !== undefined ? doc.isMandatory : doc.required,
                description: doc.description,
                sourceId: doc.sourceId
            };

            if (hasDoc) {
                ready.push(docItem);
            } else if (docItem.isMandatory) {
                missing.push(docItem);
            } else {
                unknown.push(docItem);
            }
        }

        return sendSuccess(req, res, 200, {
            serviceId: service.serviceId,
            ready,
            missing,
            unknown,
            isReadyToApply: missing.length === 0
        });
    } catch (error) {
        console.error("Document Readiness Error:", error.message);
        return sendError(req, res, 500, "DOCUMENT_CHECK_ERROR", "Document check failed.");
    }
};

// ======================================================
// DETAILED PROCEDURE PATHWAY API
// ======================================================
const getServiceProcedure = async (req, res) => {
    try {
        const { id } = req.params;

        let service;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            service = localDb.findServiceById(id);
        } else {
            service = await findServiceByIdentifier(id);
        }

        if (!service) {
            return sendError(req, res, 404, "SERVICE_NOT_FOUND", "Service not found.");
        }

        const procedure = service.procedureSteps || [];
        const steps = procedure.map(step => ({
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description,
            action: step.action || "Execute step instructions.",
            requiredInput: step.requiredInput || [],
            sourceId: step.sourceId,
            completionState: step.completionState || "Pending"
        }));

        return sendSuccess(req, res, 200, {
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            steps
        });
    } catch (error) {
        return sendError(req, res, 500, "PROCEDURE_FETCH_ERROR", "Failed to retrieve pathway steps.");
    }
};

// ======================================================
// CITATION SOURCES RETRIEVAL API
// ======================================================
const getServiceSources = async (req, res) => {
    try {
        const { id } = req.params;

        let service;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            service = localDb.findServiceById(id);
        } else {
            service = await findServiceByIdentifier(id);
        }

        if (!service) {
            return sendError(req, res, 404, "SERVICE_NOT_FOUND", "Service not found.");
        }

        const sourceIds = service.officialSources || [];
        
        let sources;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            sources = localDb.findSources({ sourceId: { $in: sourceIds } });
        } else {
            sources = await GovernmentSource.find({ sourceId: { $in: sourceIds } });
        }

        return sendSuccess(req, res, 200, {
            serviceId: service.serviceId,
            sources
        });
    } catch (error) {
        return sendError(req, res, 500, "SOURCES_FETCH_ERROR", "Failed to fetch source registry listings.");
    }
};

// ======================================================
// GRIEVANCE ESCALATION PATHWAYS API
// ======================================================
const getGrievanceRoute = async (req, res) => {
    try {
        const { id } = req.params;

        let service;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            service = localDb.findServiceById(id);
        } else {
            service = await findServiceByIdentifier(id);
        }

        if (!service) {
            return sendError(req, res, 404, "SERVICE_NOT_FOUND", "Service not found.");
        }

        const grievance = service.grievanceRoute;
        const appeal = service.appealRoute;

        if (!grievance && !appeal) {
            return sendSuccess(req, res, 200, {
                serviceId: service.serviceId,
                grievanceAvailable: false,
                message: "Verified grievance information was not found."
            });
        }

        let verifiedGrievanceUrl = null;
        if (grievance && grievance.url) {
            if (service.officialSources && service.officialSources.length > 0) {
                verifiedGrievanceUrl = await verifyOfficialUrl(service.officialSources[0]);
            }
        }

        return sendSuccess(req, res, 200, {
            serviceId: service.serviceId,
            grievanceAvailable: true,
            grievance: grievance ? {
                authority: grievance.authority,
                description: grievance.description,
                portal: grievance.portal,
                contact: grievance.contact,
                url: verifiedGrievanceUrl
            } : null,
            appeal: appeal ? {
                authority: appeal.authority,
                description: appeal.description,
                url: appeal.url
            } : null
        });
    } catch (error) {
        return sendError(req, res, 500, "GRIEVANCE_FETCH_ERROR", "Failed to fetch grievance routes.");
    }
};

// ======================================================
// AUXILIARY METADATA: BROWSE CATEGORIES & STATES
// ======================================================
const getCategories = async (req, res) => {
    try {
        let categories;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            categories = localDb.getDistinct("categories");
        } else {
            categories = await GovernmentService.distinct("categories", {
                verificationStatus: { $ne: "BLOCKED" }
            });
        }
        return sendSuccess(req, res, 200, { categories });
    } catch (error) {
        return sendError(req, res, 500, "METADATA_ERROR", "Failed to load categories.");
    }
};

const getStates = async (req, res) => {
    try {
        let states;
        if (global.useDbFallback) {
            const localDb = require("../services/government/localDbFallback");
            states = localDb.getDistinct("state").filter(Boolean);
        } else {
            states = await GovernmentService.distinct("state", {
                state: { $ne: null },
                verificationStatus: { $ne: "BLOCKED" }
            });
        }
        return sendSuccess(req, res, 200, { states });
    } catch (error) {
        return sendError(req, res, 500, "METADATA_ERROR", "Failed to load states.");
    }
};

module.exports = {
    getAllServices,
    getServiceById,
    recommendServices,
    processClarification,
    checkServiceEligibilityApi,
    getDocumentReadiness,
    getServiceProcedure,
    getServiceSources,
    getGrievanceRoute,
    getCategories,
    getStates
};
