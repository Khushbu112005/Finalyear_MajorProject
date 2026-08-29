const { sources, services } = require("../src/data/governmentSeedData");
const { validateSeedData, operators } = require("../src/data/governmentSeedValidation");
const fallback = require("../src/services/government/localDbFallback");
const request = require("supertest");
const app = require("../src/app");

describe("shared government seed dataset", () => {
  test("has the current curated service and source counts", () => { expect(services).toHaveLength(12); expect(sources).toHaveLength(12); });
  test("has unique service and source identifiers", () => { expect(new Set(services.map(x => x.serviceId)).size).toBe(services.length); expect(new Set(sources.map(x => x.sourceId)).size).toBe(sources.length); });
  test("passes complete validation", () => expect(validateSeedData(sources, services)).toEqual({ sourceCount: 12, serviceCount: 12 }));
  test("services have required fields, valid references and eligibility operators", () => { const ids = new Set(sources.map(x => x.sourceId)); services.forEach(s => { expect(s.serviceId).toBeTruthy(); expect(s.serviceName).toBeTruthy(); expect(s.description).toBeTruthy(); expect(s.categories.length).toBeGreaterThan(0); expect(s.keywords.length).toBeGreaterThan(0); s.officialSources.forEach(id => expect(ids.has(id)).toBe(true)); s.eligibilityRules.forEach(r => expect(operators.has(r.operator)).toBe(true)); }); });
  test("sources are official HTTPS records and blocked records are not trusted", () => sources.forEach(s => { expect(s.url).toMatch(/^https:\/\//); expect(s.officialUrl).toMatch(/^https:\/\//); if(s.verificationStatus === "BLOCKED") expect(s.verified).toBe(false); }));
  test("documents and procedure steps meet schema-shaped requirements", () => services.forEach(s => { s.requiredDocuments.forEach(d => { expect(d.documentId).toBeTruthy(); expect(d.documentName).toBeTruthy(); }); s.procedureSteps.forEach(p => { expect(Number.isInteger(p.stepNumber)).toBe(true); expect(p.title).toBeTruthy(); expect(p.description).toBeTruthy(); }); }));
  test("fallback exposes the exact registry rather than a duplicate dataset", () => { expect(fallback.localServices).toBe(services); expect(fallback.localSources).toBe(sources); });
});

test("serviceId lookup accepts a seeded non-ObjectId identifier", async () => {
  const response = await request(app).get("/api/government/services/central-aadhaar");
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.service.serviceId).toBe("central-aadhaar");
});
