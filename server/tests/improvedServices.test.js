// Force local DB fallback BEFORE app is required
global.useDbFallback = true;

const request = require("supertest");
const app = require("../src/app");
const { services } = require("../src/data/governmentSeedData");
const { checkEligibility } = require("../src/services/government/eligibilityEngine");

describe("Improved Services Batch 2 Integration and Unit Tests", () => {
  
  // MGNREGA Tests
  describe("central-mgnrega (Mahatma Gandhi National Rural Employment Guarantee Scheme)", () => {
    
    test("1. MGNREGA has correct schema details", () => {
      const mgnrega = services.find(s => s.serviceId === "central-mgnrega");
      expect(mgnrega).toBeTruthy();
      expect(mgnrega.categories).toContain("Employment");
      expect(mgnrega.jurisdiction).toBe("central");
      expect(mgnrega.fees).toBe("Free of cost");
      expect(mgnrega.deadlines).toBe("None (Open throughout the year)");
      expect(mgnrega.processingTime).toBe("15 days for Job Card issuance");
    });

    test("2. MGNREGA eligibility passes for age >= 18", () => {
      const mgnrega = services.find(s => s.serviceId === "central-mgnrega");
      const result = checkEligibility(mgnrega.eligibilityRules, { age: 20 });
      expect(result.status).toBe("CONFIRMED");
      expect(result.confirmed).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });

    test("3. MGNREGA eligibility fails for age < 18", () => {
      const mgnrega = services.find(s => s.serviceId === "central-mgnrega");
      const result = checkEligibility(mgnrega.eligibilityRules, { age: 16 });
      expect(result.status).toBe("FAILED");
      expect(result.confirmed).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
    });

    test("4. MGNREGA document readiness checks work correctly via API", async () => {
      const response = await request(app)
        .get("/api/government/services/central-mgnrega/document-readiness")
        .query({ availableDocuments: ["Aadhaar Card", "Bank/Post Office Account Details", "Passport-sized Photograph"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(true);
      expect(response.body.data.ready).toHaveLength(3);
      expect(response.body.data.missing).toHaveLength(0); // All mandatory docs are provided
      expect(response.body.data.unknown).toHaveLength(1); // Voter ID is optional and not provided
    });

    test("5. MGNREGA grievance route details are returned correctly via API", async () => {
      const response = await request(app).get("/api/government/services/central-mgnrega/grievance");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievanceAvailable).toBe(true);
      expect(response.body.data.grievance.authority).toContain("Ministry of Rural Development");
      expect(response.body.data.grievance.contact).toBe("Toll-Free Helpline: 1800-111-555");
    });
  });

  // IGNOAPS Tests
  describe("central-igold (Indira Gandhi National Old Age Pension Scheme)", () => {

    test("6. IGNOAPS has correct schema details", () => {
      const igold = services.find(s => s.serviceId === "central-igold");
      expect(igold).toBeTruthy();
      expect(igold.categories).toContain("Finance/Social Security");
      expect(igold.jurisdiction).toBe("central");
      expect(igold.fees).toBe("Free of cost");
      expect(igold.deadlines).toBe("None (Open throughout the year)");
      expect(igold.processingTime).toBe("30 to 45 days");
    });

    test("7. IGNOAPS eligibility passes for age >= 60 and BPL status true", () => {
      const igold = services.find(s => s.serviceId === "central-igold");
      const result = checkEligibility(igold.eligibilityRules, { age: 65, bplStatus: true });
      expect(result.status).toBe("CONFIRMED");
      expect(result.confirmed).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    test("8. IGNOAPS eligibility fails for age < 60 or BPL status false", () => {
      const igold = services.find(s => s.serviceId === "central-igold");
      
      const result1 = checkEligibility(igold.eligibilityRules, { age: 55, bplStatus: true });
      expect(result1.status).toBe("FAILED");
      expect(result1.failed).toHaveLength(1);

      const result2 = checkEligibility(igold.eligibilityRules, { age: 62, bplStatus: false });
      expect(result2.status).toBe("FAILED");
      expect(result2.failed).toHaveLength(1);
    });

    test("9. IGNOAPS document readiness checks work correctly via API", async () => {
      const response = await request(app)
        .get("/api/government/services/central-igold/document-readiness")
        .query({ availableDocuments: ["Aadhaar Card", "BPL Ration Card or Certificate"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(false);
      expect(response.body.data.missing).toHaveLength(3); // missing age proof, bank book, photo
    });

    test("10. IGNOAPS grievance route details are returned correctly via API", async () => {
      const response = await request(app).get("/api/government/services/central-igold/grievance");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievanceAvailable).toBe(true);
      expect(response.body.data.grievance.authority).toContain("Ministry of Rural Development / District Social Welfare Officer");
    });
  });

  // PMAY Tests
  describe("central-pmay (Pradhan Mantri Awas Yojana - Urban)", () => {

    test("11. PMAY-Urban has correct schema details", () => {
      const pmay = services.find(s => s.serviceId === "central-pmay");
      expect(pmay).toBeTruthy();
      expect(pmay.categories).toContain("Housing");
      expect(pmay.jurisdiction).toBe("central");
      expect(pmay.fees).toBe("Rs. 25 processing/registration fee");
      expect(pmay.processingTime).toBe("3 to 6 months");
    });

    test("12. PMAY-Urban eligibility passes for ownsPuccaHouse false and income <= 9L", () => {
      const pmay = services.find(s => s.serviceId === "central-pmay");
      const result = checkEligibility(pmay.eligibilityRules, { ownsPuccaHouse: false, annualIncome: 300000 });
      expect(result.status).toBe("CONFIRMED");
      expect(result.confirmed).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    test("13. PMAY-Urban eligibility fails if ownsPuccaHouse is true or income > 9L", () => {
      const pmay = services.find(s => s.serviceId === "central-pmay");
      
      const result1 = checkEligibility(pmay.eligibilityRules, { ownsPuccaHouse: true, annualIncome: 300000 });
      expect(result1.status).toBe("FAILED");
      expect(result1.failed).toHaveLength(1);

      const result2 = checkEligibility(pmay.eligibilityRules, { ownsPuccaHouse: false, annualIncome: 1200000 });
      expect(result2.status).toBe("FAILED");
      expect(result2.failed).toHaveLength(1);
    });

    test("14. PMAY-Urban document readiness checks work correctly via API", async () => {
      const response = await request(app)
        .get("/api/government/services/central-pmay/document-readiness")
        .query({ availableDocuments: ["Aadhaar Card", "PAN Card", "Income Certificate / ITR / Salary Slips", "Bank Account Passbook"] });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isReadyToApply).toBe(true);
      expect(response.body.data.ready).toHaveLength(4);
      expect(response.body.data.missing).toHaveLength(0); // All mandatory docs are provided
      expect(response.body.data.unknown).toHaveLength(1); // Land documents are optional and not provided
    });
  });
});
