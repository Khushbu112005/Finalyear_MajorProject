// Force local DB fallback BEFORE app is required
global.useDbFallback = true;

const request = require("supertest");
const express = require("express");
const rateLimit = require("express-rate-limit");
const app = require("../src/app");

describe("Backend Security Hardening & Input Sanitization Tests", () => {

  test("1. Normal valid query request works (GET /api/government/services)", async () => {
    const response = await request(app).get("/api/government/services");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.services)).toBe(true);
  });

  test("2. state as a normal string parameter works", async () => {
    const response = await request(app)
      .get("/api/government/services")
      .query({ state: "Maharashtra" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("3. category as a normal string parameter works", async () => {
    const response = await request(app)
      .get("/api/government/services")
      .query({ category: "Education" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("4. page as a valid positive integer works", async () => {
    const response = await request(app)
      .get("/api/government/services")
      .query({ page: "1" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pagination.page).toBe(1);
  });

  test("5. limit as a valid positive integer works", async () => {
    const response = await request(app)
      .get("/api/government/services")
      .query({ limit: "5" });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pagination.limit).toBe(5);
  });

  test("6. state[$ne] NoSQL operator injection style input is rejected with HTTP 400", async () => {
    const response = await request(app)
      .get("/api/government/services?state[$ne]=BLOCKED");
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_QUERY_PARAMETER");
    expect(response.body.error.message).toContain("state");
  });

  test("7. category[$gt] NoSQL operator injection style input is rejected with HTTP 400", async () => {
    const response = await request(app)
      .get("/api/government/services?category[$gt]=");
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_QUERY_PARAMETER");
  });

  test("8. Object-shaped query parameter is rejected with HTTP 400", async () => {
    const response = await request(app)
      .get("/api/government/services?department[foo]=bar");
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_QUERY_PARAMETER");
  });

  test("9. Invalid page parameter (negative/non-integer) is rejected with HTTP 400", async () => {
    const response = await request(app)
      .get("/api/government/services")
      .query({ page: "abc" });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_PAGINATION");

    const responseNeg = await request(app)
      .get("/api/government/services")
      .query({ page: "-1" });
    expect(responseNeg.status).toBe(400);
    expect(responseNeg.body.success).toBe(false);
  });

  test("10. Invalid limit parameter (excessive/non-integer) is rejected with HTTP 400", async () => {
    const response = await request(app)
      .get("/api/government/services")
      .query({ limit: "9999" });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_PAGINATION");
  });

  test("11. Rate limiter middleware returns HTTP 429 when request limit is exceeded", async () => {
    const testApp = express();
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 3,
      statusCode: 429,
      message: {
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests from this IP, please try again later."
        }
      }
    });

    testApp.use("/test", testLimiter, (req, res) => res.json({ success: true }));

    await request(testApp).get("/test").expect(200);
    await request(testApp).get("/test").expect(200);
    await request(testApp).get("/test").expect(200);

    const res4 = await request(testApp).get("/test");
    expect(res4.status).toBe(429);
    expect(res4.body.success).toBe(false);
    expect(res4.body.error.code).toBe("TOO_MANY_REQUESTS");
  });
});
