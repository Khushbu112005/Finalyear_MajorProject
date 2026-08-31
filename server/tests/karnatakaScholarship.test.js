// Force local DB fallback BEFORE app is required
global.useDbFallback = true;

const request = require("supertest");
const app = require("../src/app");
const { services, sources } = require("../src/data/governmentSeedData");
const { validateSeedData } = require("../src/data/governmentSeedValidation");
const { checkEligibility } = require("../src/services/government/eligibilityEngine");

describe("Karnataka State Scholarship Portal (state-kar-scholarship) Tests", () => {
  const serviceId = "state-kar-scholarship";

  test("1. Service exists in the seed dataset", () => {
    const karScholarship = services.find(s => s.serviceId === serviceId);
    expect(karScholarship).toBeTruthy();
    expect(karScholarship.serviceName).toContain("Karnataka Post-Matric Scholarship");
    expect(karScholarship.jurisdiction).toBe("state");
    expect(karScholarship.state).toBe("Karnataka");
  });

  test("2. Placeholder data is removed and replaced with realistic values", () => {
    const karScholarship = services.find(s => s.serviceId === serviceId);
    expect(karScholarship.fees).not.toBe("Check official portal");
    expect(karScholarship.deadlines).not.toBe("Check official portal");
    expect(karScholarship.processingTime).not.toBe("Check official portal");
    expect(karScholarship.description).not.toContain("consult official portal for current terms.");
    expect(karScholarship.fees).toBe("Free of cost");
  });

  test("3. Structured documents exist and mandatory ones are verified via API", async () => {
    const karScholarship = services.find(s => s.serviceId === serviceId);
    expect(karScholarship.requiredDocuments.length).toBeGreaterThanOrEqual(4);
    
    const response = await request(app)
      .get(`/api/government/services/${serviceId}/document-readiness`)
      .query({
        availableDocuments: [
          "Student SSP ID / Aadhaar Number",
          "Caste and Income Certificate (RD Number)",
          "SSLC Reg No & Previous Marksheet",
          "e-Attestation Numbers",
          "Aadhaar-Seeded Bank Account Passbook"
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isReadyToApply).toBe(true);
    expect(response.body.data.missing).toHaveLength(0);
  });

  test("4. Structured procedure steps exist", () => {
    const karScholarship = services.find(s => s.serviceId === serviceId);
    expect(karScholarship.procedureSteps.length).toBeGreaterThanOrEqual(5);
    karScholarship.procedureSteps.forEach(step => {
      expect(step.stepNumber).toBeGreaterThan(0);
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.sourceId).toBe("src-ssp-karnataka");
    });
  });

  test("5. Application methods are present and officially supported", () => {
    const karScholarship = services.find(s => s.serviceId === serviceId);
    expect(karScholarship.applicationMethods).toContain("Online (SSP Post-Matric Portal - ssp.postmatric.karnataka.gov.in)");
  });

  test("6. Eligibility rules are valid and correctly evaluated", () => {
    const karScholarship = services.find(s => s.serviceId === serviceId);
    expect(karScholarship.eligibilityRules.length).toBe(2);

    const resultPass = checkEligibility(karScholarship.eligibilityRules, {
      state: "Karnataka",
      studentStatus: true
    });
    expect(resultPass.status).toBe("CONFIRMED");
    expect(resultPass.confirmed).toHaveLength(2);

    const resultFailState = checkEligibility(karScholarship.eligibilityRules, {
      state: "Tamil Nadu",
      studentStatus: true
    });
    expect(resultFailState.status).toBe("FAILED");
  });

  test("7. Grievance route is valid and accessible via API", async () => {
    const response = await request(app).get(`/api/government/services/${serviceId}/grievance`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.grievanceAvailable).toBe(true);
    expect(response.body.data.grievance.authority).toContain("Karnataka Social Welfare");
    expect(response.body.data.grievance.contact).toContain("080-22634300");
  });

  test("8. Official source IDs are valid and exist in source registry", () => {
    const karScholarship = services.find(s => s.serviceId === serviceId);
    expect(karScholarship.officialSources).toContain("src-ssp-karnataka");
    const sourceObj = sources.find(s => s.sourceId === "src-ssp-karnataka");
    expect(sourceObj).toBeTruthy();
    expect(sourceObj.url).toBe("https://ssp.postmatric.karnataka.gov.in/");
  });

  test("9. Seed data validation passes without error", () => {
    expect(() => validateSeedData(sources, services)).not.toThrow();
  });
});
