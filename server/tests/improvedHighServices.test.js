// Force local DB fallback BEFORE app is required
global.useDbFallback = true;

const request = require("supertest");
const app = require("../src/app");
const { services } = require("../src/data/governmentSeedData");
const { checkEligibility } = require("../src/services/government/eligibilityEngine");

describe("Improved HIGH-Priority Services (Batch 4) Integration and Unit Tests", () => {

  // central-pmmvy Tests
  describe("central-pmmvy (Pradhan Mantri Matru Vandana Yojana)", () => {
    test("1. PMMVY has correct schema and official details", () => {
      const pmmvy = services.find(s => s.serviceId === "central-pmmvy");
      expect(pmmvy).toBeTruthy();
      expect(pmmvy.categories).toContain("Women/Child Welfare");
      expect(pmmvy.jurisdiction).toBe("central");
      expect(pmmvy.fees).toBe("Free of cost");
      expect(pmmvy.processingTime).toContain("30 to 60 days");
    });

    test("2. PMMVY eligibility passes for Female and income <= 8L", () => {
      const pmmvy = services.find(s => s.serviceId === "central-pmmvy");
      const resultPass = checkEligibility(pmmvy.eligibilityRules, { gender: "Female", annualIncome: 200000 });
      expect(resultPass.status).toBe("CONFIRMED");
      expect(resultPass.confirmed).toHaveLength(2);

      const resultFailGender = checkEligibility(pmmvy.eligibilityRules, { gender: "Male", annualIncome: 200000 });
      expect(resultFailGender.status).toBe("FAILED");

      const resultFailIncome = checkEligibility(pmmvy.eligibilityRules, { gender: "Female", annualIncome: 1000000 });
      expect(resultFailIncome.status).toBe("FAILED");
    });

    test("3. PMMVY document readiness via API checks mandatory MCP card, Aadhaar, Bank Book", async () => {
      const response = await request(app)
        .get("/api/government/services/central-pmmvy/document-readiness")
        .query({ availableDocuments: ["Aadhaar Card", "Mother and Child Protection (MCP) Card", "Bank / Post Office Account Passbook", "Income Certificate / BPL Card / MGNREGA Job Card"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(true);
      expect(response.body.data.ready).toHaveLength(4);
      expect(response.body.data.missing).toHaveLength(0);
    });

    test("4. PMMVY grievance route details are returned correctly via API", async () => {
      const response = await request(app).get("/api/government/services/central-pmmvy/grievance");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievanceAvailable).toBe(true);
      expect(response.body.data.grievance.authority).toContain("Ministry of Women and Child Development");
      expect(response.body.data.grievance.contact).toContain("011-23382393");
    });
  });

  // central-udid Tests
  describe("central-udid (Unique Disability ID)", () => {
    test("5. UDID has correct schema and official details", () => {
      const udid = services.find(s => s.serviceId === "central-udid");
      expect(udid).toBeTruthy();
      expect(udid.categories).toContain("Disability/Accessibility");
      expect(udid.jurisdiction).toBe("central");
      expect(udid.fees).toBe("Free of cost");
      expect(udid.processingTime).toContain("1 to 3 months");
    });

    test("6. UDID eligibility passes for disabilityStatus true and fails for false", () => {
      const udid = services.find(s => s.serviceId === "central-udid");
      const resultPass = checkEligibility(udid.eligibilityRules, { disabilityStatus: true });
      expect(resultPass.status).toBe("CONFIRMED");

      const resultFail = checkEligibility(udid.eligibilityRules, { disabilityStatus: false });
      expect(resultFail.status).toBe("FAILED");
    });

    test("7. UDID document readiness via API recognizes mandatory Aadhaar, Address Proof, Photo", async () => {
      const response = await request(app)
        .get("/api/government/services/central-udid/document-readiness")
        .query({ availableDocuments: ["Aadhaar Card / Proof of Identity", "Proof of Address", "Passport-sized Photograph"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(true);
      expect(response.body.data.ready).toHaveLength(3);
      expect(response.body.data.missing).toHaveLength(0);
      expect(response.body.data.unknown).toHaveLength(1); // Existing certificate is optional
    });

    test("8. UDID grievance route details are returned correctly via API", async () => {
      const response = await request(app).get("/api/government/services/central-udid/grievance");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievanceAvailable).toBe(true);
      expect(response.body.data.grievance.authority).toContain("Department of Empowerment of Persons with Disabilities");
      expect(response.body.data.grievance.contact).toContain("011-24365019");
    });
  });

  // state-maha-employment Tests
  describe("state-maha-employment (MahaSwayam Employment Services)", () => {
    test("9. MahaSwayam has correct schema and official details", () => {
      const maha = services.find(s => s.serviceId === "state-maha-employment");
      expect(maha).toBeTruthy();
      expect(maha.categories).toContain("Employment");
      expect(maha.jurisdiction).toBe("state");
      expect(maha.state).toBe("Maharashtra");
      expect(maha.fees).toBe("Free of cost");
      expect(maha.processingTime).toContain("Instant");
    });

    test("10. MahaSwayam eligibility passes for Maharashtra state & Unemployed status", () => {
      const maha = services.find(s => s.serviceId === "state-maha-employment");
      const resultPass = checkEligibility(maha.eligibilityRules, { state: "Maharashtra", employmentStatus: "Unemployed" });
      expect(resultPass.status).toBe("CONFIRMED");
      expect(resultPass.confirmed).toHaveLength(2);

      const resultFailState = checkEligibility(maha.eligibilityRules, { state: "Karnataka", employmentStatus: "Unemployed" });
      expect(resultFailState.status).toBe("FAILED");
    });

    test("11. MahaSwayam document readiness via API checks mandatory Domicile and Educational certificates", async () => {
      const response = await request(app)
        .get("/api/government/services/state-maha-employment/document-readiness")
        .query({ availableDocuments: ["Aadhaar Card", "Domicile Certificate of Maharashtra", "Educational Marksheets / Certificates", "Passport-sized Photograph"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(true);
      expect(response.body.data.ready).toHaveLength(4);
      expect(response.body.data.missing).toHaveLength(0);
    });

    test("12. MahaSwayam grievance route details are returned correctly via API", async () => {
      const response = await request(app).get("/api/government/services/state-maha-employment/grievance");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievanceAvailable).toBe(true);
      expect(response.body.data.grievance.authority).toContain("Skill Development, Employment and Entrepreneurship Department");
      expect(response.body.data.grievance.contact).toContain("022-22625651");
    });
  });
});
