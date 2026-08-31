// Force local DB fallback BEFORE app is required
global.useDbFallback = true;

const request = require("supertest");
const app = require("../src/app");
const { services } = require("../src/data/governmentSeedData");
const { checkEligibility } = require("../src/services/government/eligibilityEngine");

describe("Improved Critical Services (Batch 3) Integration and Unit Tests", () => {

  // central-aadhaar Tests
  describe("central-aadhaar (Aadhaar Services - UIDAI)", () => {
    test("1. Aadhaar has correct schema and official portal details", () => {
      const aadhaar = services.find(s => s.serviceId === "central-aadhaar");
      expect(aadhaar).toBeTruthy();
      expect(aadhaar.categories).toContain("Identity/Documents");
      expect(aadhaar.jurisdiction).toBe("central");
      expect(aadhaar.fees).toContain("Free for new enrolment");
      expect(aadhaar.deadlines).toBe("None (Open throughout the year)");
      expect(aadhaar.processingTime).toBe("Up to 90 days from enrolment date");
      expect(aadhaar.procedureSteps.length).toBeGreaterThanOrEqual(5);
    });

    test("2. Aadhaar document readiness via API recognizes mandatory PoI, PoA, PoDB", async () => {
      const response = await request(app)
        .get("/api/government/services/central-aadhaar/document-readiness")
        .query({ availableDocuments: ["Proof of Identity (PoI)", "Proof of Address (PoA)", "Proof of Date of Birth (PoDB)"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(true);
      expect(response.body.data.ready).toHaveLength(3);
      expect(response.body.data.missing).toHaveLength(0);
      expect(response.body.data.unknown).toHaveLength(1); // PoR is optional
    });

    test("3. Aadhaar grievance route details are returned correctly via API", async () => {
      const response = await request(app).get("/api/government/services/central-aadhaar/grievance");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievanceAvailable).toBe(true);
      expect(response.body.data.grievance.authority).toContain("Unique Identification Authority of India (UIDAI)");
      expect(response.body.data.grievance.contact).toContain("1947");
    });
  });

  // central-pmjay Tests
  describe("central-pmjay (Ayushman Bharat PM-JAY)", () => {
    test("4. PM-JAY has correct schema details", () => {
      const pmjay = services.find(s => s.serviceId === "central-pmjay");
      expect(pmjay).toBeTruthy();
      expect(pmjay.categories).toContain("Health");
      expect(pmjay.jurisdiction).toBe("central");
      expect(pmjay.fees).toContain("Free of cost");
      expect(pmjay.processingTime).toBe("On-spot e-KYC and instant Ayushman Card generation");
    });

    test("5. PM-JAY eligibility passes for BPL status true and fails for BPL status false", () => {
      const pmjay = services.find(s => s.serviceId === "central-pmjay");
      const resultPass = checkEligibility(pmjay.eligibilityRules, { bplStatus: true });
      expect(resultPass.status).toBe("CONFIRMED");
      expect(resultPass.confirmed).toHaveLength(1);

      const resultFail = checkEligibility(pmjay.eligibilityRules, { bplStatus: false });
      expect(resultFail.status).toBe("FAILED");
      expect(resultFail.failed).toHaveLength(1);
    });

    test("6. PM-JAY document readiness checks work correctly via API", async () => {
      const response = await request(app)
        .get("/api/government/services/central-pmjay/document-readiness")
        .query({ availableDocuments: ["Aadhaar Card", "Ration Card / Family ID", "SECC / PM-JAY Family Eligibility Document"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(true);
      expect(response.body.data.ready).toHaveLength(3);
      expect(response.body.data.missing).toHaveLength(0);
    });

    test("7. PM-JAY grievance route details are returned correctly via API", async () => {
      const response = await request(app).get("/api/government/services/central-pmjay/grievance");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievanceAvailable).toBe(true);
      expect(response.body.data.grievance.authority).toContain("National Health Authority");
      expect(response.body.data.grievance.contact).toContain("14555");
    });
  });

  // central-nsp Tests
  describe("central-nsp (National Scholarship Portal)", () => {
    test("8. NSP has correct schema details", () => {
      const nsp = services.find(s => s.serviceId === "central-nsp");
      expect(nsp).toBeTruthy();
      expect(nsp.categories).toContain("Education");
      expect(nsp.jurisdiction).toBe("central");
      expect(nsp.fees).toBe("Free of cost");
      expect(nsp.processingTime).toContain("institutional verification");
    });

    test("9. NSP eligibility passes for studentStatus true & income <= 2.5L", () => {
      const nsp = services.find(s => s.serviceId === "central-nsp");
      const resultPass = checkEligibility(nsp.eligibilityRules, { studentStatus: true, annualIncome: 150000 });
      expect(resultPass.status).toBe("CONFIRMED");
      expect(resultPass.confirmed).toHaveLength(2);

      const resultFailStudent = checkEligibility(nsp.eligibilityRules, { studentStatus: false, annualIncome: 150000 });
      expect(resultFailStudent.status).toBe("FAILED");

      const resultFailIncome = checkEligibility(nsp.eligibilityRules, { studentStatus: true, annualIncome: 350000 });
      expect(resultFailIncome.status).toBe("FAILED");
    });

    test("10. NSP document readiness checks work correctly via API", async () => {
      const response = await request(app)
        .get("/api/government/services/central-nsp/document-readiness")
        .query({ availableDocuments: ["Aadhaar Card", "Family Income Certificate", "Previous Academic Marksheet", "Bonafide Student Certificate / Fee Receipt", "Bank Account Passbook"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(true);
      expect(response.body.data.ready).toHaveLength(5);
      expect(response.body.data.missing).toHaveLength(0);
      expect(response.body.data.unknown).toHaveLength(1); // Caste Certificate is optional
    });

    test("11. NSP grievance route details are returned correctly via API", async () => {
      const response = await request(app).get("/api/government/services/central-nsp/grievance");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievanceAvailable).toBe(true);
      expect(response.body.data.grievance.authority).toContain("Ministry of Education");
      expect(response.body.data.grievance.contact).toContain("0120-6619540");
    });
  });
});
