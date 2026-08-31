const express = require("express");
const devAuth = require("../middleware/devAuth");

const {
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
} = require("../controllers/governmentController");

const router = express.Router();

// Apply mock development identity middleware globally for this router
router.use(devAuth);

// Core Government Service API Routes
router.get("/services", getAllServices);
router.get("/services/:id", getServiceById);

router.post("/recommend", recommendServices);
router.post("/clarify", processClarification);
router.post("/services/:id/eligibility", checkServiceEligibilityApi);

router.get("/services/:id/procedure", getServiceProcedure);
router.get("/services/:id/document-readiness", getDocumentReadiness);
router.get("/services/:id/sources", getServiceSources);
router.get("/services/:id/grievance", getGrievanceRoute);

router.get("/categories", getCategories);
router.get("/states", getStates);

module.exports = router;