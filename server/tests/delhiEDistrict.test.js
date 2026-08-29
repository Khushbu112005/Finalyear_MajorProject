// Force local DB fallback BEFORE app is required
global.useDbFallback = true;

const request = require("supertest");
const app = require("../src/app");
const { services, sources } = require("../src/data/governmentSeedData");
const { validateSeedData } = require("../src/data/governmentSeedValidation");
const { checkEligibility } = require("../src/services/government/eligibilityEngine");

describe("Delhi e-District Citizen Services (state-delhi-edistrict) Tests", () => {
  const serviceId = "state-delhi-edistrict";

  test("1. Service exists in the seed dataset", () => {
    const delhiService = services.find(s => s.serviceId === serviceId);
    expect(delhiService).toBeTruthy();
    expect(delhiService.serviceName).toContain("Delhi e-District");
    expect(delhiService.jurisdiction).toBe("state");
    expect(delhiService.state).toBe("Delhi");
  });

  test("2. Placeholder description and data are removed and replaced", () => {
    const delhiService = services.find(s => s.serviceId === serviceId);
    expect(delhiService.description).not.toContain("consult official portal for current terms.");
    expect(delhiService.fees).not.toBe("Check official portal");
    expect(delhiService.deadlines).not.toBe("Check official portal");
    expect(delhiService.processingTime).not.toBe("Check official portal");
    expect(delhiService.description).toContain("Government of NCT of Delhi");
  });

  test("3. Eligibility rules are valid and correctly evaluated for Delhi state", () => {
    const delhiService = services.find(s => s.serviceId === serviceId);
    expect(delhiService.eligibilityRules.length).toBe(1);

    const resultPass = checkEligibility(delhiService.eligibilityRules, { state: "Delhi" });
    expect(resultPass.status).toBe("CONFIRMED");
    expect(resultPass.confirmed).toHaveLength(1);

    const resultFail = checkEligibility(delhiService.eligibilityRules, { state: "Haryana" });
    expect(resultFail.status).toBe("FAILED");
  });

  test("4. Structured documents exist where officially supported", () => {
    const delhiService = services.find(s => s.serviceId === serviceId);
    expect(delhiService.requiredDocuments.length).toBeGreaterThanOrEqual(4);
    const mandatoryDocs = delhiService.requiredDocuments.filter(d => d.isMandatory);
    expect(mandatoryDocs.length).toBe(4);
  });

  test("5. Procedure steps are structured and valid", () => {
    const delhiService = services.find(s => s.serviceId === serviceId);
    expect(delhiService.procedureSteps.length).toBe(6);
    delhiService.procedureSteps.forEach(step => {
      expect(step.stepNumber).toBeGreaterThan(0);
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.sourceId).toBe("src-delhi");
    });
  });

  test("6. Application methods are valid and officially supported", () => {
    const delhiService = services.find(s => s.serviceId === serviceId);
    expect(delhiService.applicationMethods).toContain("Online (Delhi e-District Portal - edistrict.delhigovt.nic.in)");
  });

  test("7. Official source references are valid", () => {
    const delhiService = services.find(s => s.serviceId === serviceId);
    expect(delhiService.officialSources).toContain("src-delhi");
    const sourceObj = sources.find(s => s.sourceId === "src-delhi");
    expect(sourceObj).toBeTruthy();
    expect(sourceObj.url).toBe("https://edistrict.delhigovt.nic.in/");
  });

  test("8. Grievance route is valid and accessible via API", async () => {
    const response = await request(app).get(`/api/government/services/${serviceId}/grievance`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.grievanceAvailable).toBe(true);
    expect(response.body.data.grievance.authority).toContain("Revenue Department");
    expect(response.body.data.grievance.contact).toContain("011-23935730");
  });

  test("9. Seed data validation passes without error", () => {
    expect(() => validateSeedData(sources, services)).not.toThrow();
  });

  test("10. API response for this service remains valid (GET service by ID)", async () => {
    const response = await request(app).get(`/api/government/services/${serviceId}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.service.serviceId).toBe(serviceId);
    expect(response.body.data.service.serviceName).toBe("Delhi e-District Citizen Services");
    expect(response.body.data.service.eligibilityRules).toHaveLength(1);
    expect(response.body.data.service.requiredDocuments.length).toBeGreaterThanOrEqual(4);
  });
});
