const { rankServices } = require("../src/services/government/recommendationEngine");
const GovernmentSource = require("../src/models/GovernmentSource");

// Mock the Mongoose GovernmentSource query inside calculateSourceReliability
jest.mock("../src/models/GovernmentSource");

describe("Recommendation & Ranking Engine Unit Tests", () => {
    
    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();
        GovernmentSource.find.mockResolvedValue([]);
    });

    const mockServices = [
        {
            serviceId: "central-pm-kisan",
            serviceName: "PM Kisan Nidhi",
            description: "Farmer support crop funding",
            jurisdiction: "central",
            keywords: ["farmer", "kisan", "crop"],
            eligibilityRules: [
                { field: "employmentStatus", operator: "equals", value: "Farmer" }
            ],
            procedureSteps: [{}, {}, {}], // 3 steps
            lastVerified: new Date(),
            confidence: 0.95
        },
        {
            serviceId: "state-maha-unemployment",
            serviceName: "Maharashtra Educated Allowance",
            description: "Jobless youth allowance support",
            jurisdiction: "state",
            state: "Maharashtra",
            keywords: ["unemployed", "youth", "jobless"],
            eligibilityRules: [
                { field: "state", operator: "equals", value: "Maharashtra" },
                { field: "employmentStatus", operator: "equals", value: "Unemployed" }
            ],
            procedureSteps: [{}, {}, {}, {}, {}], // 5 steps
            lastVerified: new Date(),
            confidence: 0.90
        }
    ];

    test("Recommendation sorts by weighted components", async () => {
        const query = "support for farmer families";
        const context = {
            state: "Maharashtra",
            employmentStatus: "Farmer"
        };

        const results = await rankServices(mockServices, query, context);
        
        expect(results.length).toBe(2);
        
        // PM Kisan should be sorted first since context has employmentStatus = Farmer
        // Maharashtra Allowance has employmentStatus = Unemployed, which fails context
        expect(results[0].service.serviceId).toBe("central-pm-kisan");
        expect(results[0].overallScore).toBeGreaterThan(results[1].overallScore);
        
        // Verify component properties exist
        expect(results[0].components).toHaveProperty("problemRelevance");
        expect(results[0].components).toHaveProperty("eligibilityCompatibility");
        expect(results[0].components).toHaveProperty("jurisdictionMatch");
        expect(results[0].components.jurisdictionMatch).toBe(0.85);
    });

    test("Jurisdiction filtering rejects wrong state", async () => {
        const query = "jobless youth";
        const context = {
            state: "Karnataka", // Karnataka resident queries Maharashtra benefit
            employmentStatus: "Unemployed"
        };

        const results = await rankServices(mockServices, query, context);
        
        // Maha scheme should get 0.0 jurisdictionMatch
        const mahaResult = results.find(r => r.service.serviceId === "state-maha-unemployment");
        expect(mahaResult.components.jurisdictionMatch).toBe(0.0);
    });
});
