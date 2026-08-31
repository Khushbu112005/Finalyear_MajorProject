// Force local DB fallback BEFORE app is required
global.useDbFallback = true;

const request = require("supertest");
const app = require("../src/app");
const { services, sources } = require("../src/data/governmentSeedData");
const { validateSeedData } = require("../src/data/governmentSeedValidation");
const { checkEligibility } = require("../src/services/government/eligibilityEngine");

describe("PM-KISAN Scheme (central-pm-kisan) Completion Tests", () => {
  const serviceId = "central-pm-kisan";

  test("1. Service exists in the seed dataset", () => {
    const kisanService = services.find(s => s.serviceId === serviceId);
    expect(kisanService).toBeTruthy();
    expect(kisanService.serviceName).toContain("Pradhan Mantri Kisan Samman Nidhi");
    expect(kisanService.jurisdiction).toBe("central");
  });

  test("2. Existing eligibility rules remain unchanged (occupation, employmentStatus, annualIncome)", () => {
    const kisanService = services.find(s => s.serviceId === serviceId);
    expect(kisanService.eligibilityRules).toHaveLength(3);
    expect(kisanService.eligibilityRules[0]).toEqual({ field: "occupation", operator: "equals", value: "Farmer" });
    expect(kisanService.eligibilityRules[1]).toEqual({ field: "employmentStatus", operator: "equals", value: "Farmer" });
    expect(kisanService.eligibilityRules[2]).toEqual({ field: "annualIncome", operator: "less_than_or_equal", value: 300000 });

    const resultPass = checkEligibility(kisanService.eligibilityRules, { occupation: "Farmer", employmentStatus: "Farmer", annualIncome: 200000 });
    expect(resultPass.status).toBe("CONFIRMED");
  });

  test("3. Existing required documents remain unchanged (doc-aadhaar, doc-landhold, doc-bankbook)", () => {
    const kisanService = services.find(s => s.serviceId === serviceId);
    expect(kisanService.requiredDocuments).toHaveLength(3);
    const docIds = kisanService.requiredDocuments.map(d => d.documentId);
    expect(docIds).toEqual(["doc-aadhaar", "doc-landhold", "doc-bankbook"]);
  });

  test("4. Structured procedureSteps exist with 6 detailed steps", () => {
    const kisanService = services.find(s => s.serviceId === serviceId);
    expect(kisanService.procedureSteps.length).toBe(6);
    kisanService.procedureSteps.forEach(step => {
      expect(step.stepNumber).toBeGreaterThan(0);
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.sourceId).toBe("src-pmkisan-official");
    });
  });

  test("5. ApplicationMethods are valid and present", () => {
    const kisanService = services.find(s => s.serviceId === serviceId);
    expect(kisanService.applicationMethods).toContain("Online (PM-KISAN Portal - pmkisan.gov.in)");
    expect(kisanService.applicationMethods).toContain("PM-KISAN Mobile App");
  });

  test("6. Fees, deadlines, processingTime do not contain generic placeholder text", () => {
    const kisanService = services.find(s => s.serviceId === serviceId);
    expect(kisanService.fees).not.toBe("Check official portal");
    expect(kisanService.deadlines).not.toBe("Check official portal");
    expect(kisanService.processingTime).not.toBe("Check official portal");
    expect(kisanService.description).not.toContain("consult official portal for current terms.");
    expect(kisanService.fees).toBe("Free of cost");
  });

  test("7. GrievanceRoute is correctly structured and verified via API endpoint", async () => {
    const response = await request(app).get(`/api/government/services/${serviceId}/grievance`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.grievanceAvailable).toBe(true);
    expect(response.body.data.grievance.authority).toContain("Department of Agriculture");
    expect(response.body.data.grievance.contact).toContain("155261");
  });

  test("8. SourceId references are valid and match official source registry", () => {
    const kisanService = services.find(s => s.serviceId === serviceId);
    expect(kisanService.officialSources).toContain("src-pmkisan-official");
    const sourceObj = sources.find(s => s.sourceId === "src-pmkisan-official");
    expect(sourceObj).toBeTruthy();
    expect(sourceObj.url).toBe("https://pmkisan.gov.in/");
  });

  test("9. Seed data validation passes without error", () => {
    expect(() => validateSeedData(sources, services)).not.toThrow();
  });

  test("10. API endpoints continue returning successful responses (GET Service by ID)", async () => {
    const response = await request(app).get(`/api/government/services/${serviceId}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.service.serviceId).toBe(serviceId);
    expect(response.body.data.service.procedureSteps.length).toBe(6);
  });
});
