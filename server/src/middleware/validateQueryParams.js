/**
 * Middleware to sanitize and validate req.query parameters, preventing NoSQL / Mongoose operator injection.
 */

const isObject = (val) => val !== null && typeof val === 'object' && !Array.isArray(val);

const containsMongoOperators = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    for (const key of Object.keys(obj)) {
        if (key.includes('$') || key.includes('[') || key.includes(']')) return true;
        if (typeof obj[key] === 'object' && containsMongoOperators(obj[key])) return true;
    }
    return false;
};

const validateQueryParams = (req, res, next) => {
    const query = req.query;
    if (!query) return next();

    // Check if any query parameter key or nested value contains bracket notation or MongoDB operator syntax ($ne, $gt, $regex, etc.) or object structure
    for (const [key, value] of Object.entries(query)) {
        if (key.includes('$') || key.includes('[') || key.includes(']') || containsMongoOperators(value) || isObject(value)) {
            return res.status(400).json({
                success: false,
                request_id: req.request_id || "dev-req",
                error: {
                    code: "INVALID_QUERY_PARAMETER",
                    message: `Query parameter '${key}' contains invalid object structure or MongoDB operator syntax.`
                }
            });
        }
    }

    // Validate string fields if present
    const stringFields = ['state', 'category', 'department', 'serviceType'];
    for (const field of stringFields) {
        if (query[field] !== undefined) {
            if (typeof query[field] !== 'string') {
                return res.status(400).json({
                    success: false,
                    request_id: req.request_id || "dev-req",
                    error: {
                        code: "INVALID_QUERY_PARAMETER",
                        message: `Query parameter '${field}' must be a scalar string.`
                    }
                });
            }
        }
    }

    // Validate integer fields if present (page, limit)
    if (query.page !== undefined) {
        const pageNum = Number(query.page);
        if (!Number.isInteger(pageNum) || pageNum < 1 || String(query.page).trim() === '') {
            return res.status(400).json({
                success: false,
                request_id: req.request_id || "dev-req",
                error: {
                    code: "INVALID_PAGINATION",
                    message: "Query parameter 'page' must be a valid positive integer."
                }
            });
        }
    }

    if (query.limit !== undefined) {
        const limitNum = Number(query.limit);
        if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100 || String(query.limit).trim() === '') {
            return res.status(400).json({
                success: false,
                request_id: req.request_id || "dev-req",
                error: {
                    code: "INVALID_PAGINATION",
                    message: "Query parameter 'limit' must be a valid positive integer between 1 and 100."
                }
            });
        }
    }

    next();
};

module.exports = validateQueryParams;
