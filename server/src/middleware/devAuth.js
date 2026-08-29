const crypto = require("crypto");

/**
 * Development-only Mock Authentication Middleware.
 * Injects a mock citizen context if no real authentication is present.
 * Can be customized using headers for testing different scenarios.
 */
const devAuth = (req, res, next) => {
    // Generate a unique request ID for observability
    req.request_id = crypto.randomUUID();

    // Default development citizen context
    const defaultCitizen = {
        age: 28,
        gender: "Female",
        state: "Maharashtra",
        district: "Pune",
        ruralUrban: "Rural",
        occupation: "Farmer",
        employmentStatus: "Farmer",
        annualIncome: 180000,
        socialCategory: "General",
        disabilityStatus: false,
        studentStatus: false,
        availableDocuments: ["Aadhaar", "Bank account proof"]
    };

    // Allow headers to override specific fields for testing scenarions (e.g. wrong jurisdiction)
    const stateHeader = req.headers["x-mock-state"] || req.query.mockState;
    const districtHeader = req.headers["x-mock-district"] || req.query.mockDistrict;
    const incomeHeader = req.headers["x-mock-income"] || req.query.mockIncome;
    const ageHeader = req.headers["x-mock-age"] || req.query.mockAge;
    const empHeader = req.headers["x-mock-employment"] || req.query.mockEmployment;
    const docsHeader = req.headers["x-mock-documents"] || req.query.mockDocuments; // comma-separated

    const userProfile = { ...defaultCitizen };

    if (stateHeader) userProfile.state = stateHeader;
    if (districtHeader) userProfile.district = districtHeader;
    if (incomeHeader) userProfile.annualIncome = Number(incomeHeader);
    if (ageHeader) userProfile.age = Number(ageHeader);
    if (empHeader) userProfile.employmentStatus = empHeader;
    
    if (docsHeader) {
        userProfile.availableDocuments = docsHeader.split(",").map(d => d.trim());
    }

    req.user = {
        userId: "dev-user-001",
        role: "citizen",
        citizenContext: userProfile
    };

    next();
};

module.exports = devAuth;
