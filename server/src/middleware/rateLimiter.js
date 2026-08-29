const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware for CivicSphere Government Navigator API
 * Protects public API endpoints from excessive request bursts.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 200, // Limit each IP to 200 requests per 15 minutes
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    statusCode: 429,
    message: {
        success: false,
        request_id: "dev-req",
        error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests from this IP address, please try again later."
        }
    }
});

module.exports = apiLimiter;
