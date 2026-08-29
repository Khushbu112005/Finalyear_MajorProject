// Force local DB fallback BEFORE app is required
global.useDbFallback = true;

const { services } = require("../src/data/governmentSeedData");
const { rankServices, calculateJurisdictionMatch } = require("../src/services/government/recommendationEngine");

describe("Recommendation Engine Jurisdiction Ranking Tests", () => {

  test("1. Karnataka student searching for scholarship ranks state-kar-scholarship above central-nsp", async () => {
    const context = { state: "Karnataka", studentStatus: true, annualIncome: 120000 };
    const query = "I am a college student in Bangalore seeking financial scholarships to pay tuition fees.";
    
    const candidates = services.filter(s => s.categories.includes("Education"));
    const ranked = await rankServices(candidates, query, context);

    expect(ranked.length).toBeGreaterThan(1);
    expect(ranked[0].service.serviceId).toBe("state-kar-scholarship");
    expect(ranked[0].overallScore).toBeGreaterThan(ranked[1].overallScore);
  });

  test("2. Maharashtra unemployed user searching for employment receives state-jurisdiction advantage for state-maha-employment", async () => {
    const context = { state: "Maharashtra", employmentStatus: "Unemployed", annualIncome: 80000 };
    const query = "I need employment registration and job placement assistance in Maharashtra.";
    
    const candidates = services.filter(s => s.categories.includes("Employment"));
    const ranked = await rankServices(candidates, query, context);

    const mahaService = ranked.find(r => r.service.serviceId === "state-maha-employment");
    const mgnregaService = ranked.find(r => r.service.serviceId === "central-mgnrega");
    
    expect(mahaService).toBeTruthy();
    expect(mgnregaService).toBeTruthy();
    expect(mahaService.components.jurisdictionMatch).toBe(1.0);
    expect(mgnregaService.components.jurisdictionMatch).toBe(0.85);
  });

  test("3. Delhi resident searching for certificate services receives state-jurisdiction advantage for state-delhi-edistrict", async () => {
    const context = { state: "Delhi" };
    const query = "Delhi e-district revenue certificates";
    
    const delhiService = services.find(s => s.serviceId === "state-delhi-edistrict");
    const centralService = services.find(s => s.serviceId === "central-aadhaar");

    const matchDelhi = calculateJurisdictionMatch(delhiService, context);
    const matchCentral = calculateJurisdictionMatch(centralService, context);

    expect(matchDelhi).toBe(1.0);
    expect(matchCentral).toBe(0.85);
  });

  test("4. National scholarship query without state gives central-nsp 1.0 jurisdiction match", async () => {
    const context = {}; // No state
    const query = "National scholarship portal for post-matric education";
    
    const candidates = services.filter(s => s.categories.includes("Education"));
    const ranked = await rankServices(candidates, query, context);

    const nspService = ranked.find(r => r.service.serviceId === "central-nsp");
    const karService = ranked.find(r => r.service.serviceId === "state-kar-scholarship");

    expect(nspService.components.jurisdictionMatch).toBe(1.0);
    expect(karService.components.jurisdictionMatch).toBe(0.5);
    expect(ranked[0].service.serviceId).toBe("central-nsp");
  });

  test("5. Specific central scholarship query strongly favors central-nsp even for a Karnataka student", async () => {
    const context = { state: "Karnataka", studentStatus: true };
    const query = "National Scholarship Portal NSP central education scheme";
    
    const candidates = services.filter(s => s.categories.includes("Education"));
    const ranked = await rankServices(candidates, query, context);

    expect(ranked[0].service.serviceId).toBe("central-nsp");
  });

  test("6. User state mismatch yields 0.0 jurisdiction score for non-matching state scheme", () => {
    const context = { state: "Karnataka" };
    const mahaService = services.find(s => s.serviceId === "state-maha-employment");
    
    const match = calculateJurisdictionMatch(mahaService, context);
    expect(match).toBe(0.0);
  });

  test("7. Missing user state yields 0.5 default jurisdiction score for state schemes without artificial bonus", () => {
    const context = {}; // No state
    const karService = services.find(s => s.serviceId === "state-kar-scholarship");
    
    const match = calculateJurisdictionMatch(karService, context);
    expect(match).toBe(0.5);
  });

});
