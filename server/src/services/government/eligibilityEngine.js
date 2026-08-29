const evaluateRule = (userValue, operator, requiredValue) => {
    // Normalize string representation of booleans
    let normUserVal = userValue;
    if (typeof userValue === "string") {
        if (userValue.toLowerCase() === "true") normUserVal = true;
        if (userValue.toLowerCase() === "false") normUserVal = false;
    }

    let normReqVal = requiredValue;
    if (typeof requiredValue === "string") {
        if (requiredValue.toLowerCase() === "true") normReqVal = true;
        if (requiredValue.toLowerCase() === "false") normReqVal = false;
    }

    switch (operator) {
        case "equals":
            return normUserVal === normReqVal;

        case "not_equals":
            return normUserVal !== normReqVal;

        case "greater_than":
            return Number(normUserVal) > Number(normReqVal);

        case "less_than":
            return Number(normUserVal) < Number(normReqVal);

        case "greater_than_or_equal":
            return Number(normUserVal) >= Number(normReqVal);

        case "less_than_or_equal":
            return Number(normUserVal) <= Number(normReqVal);

        case "contains":
            if (Array.isArray(normUserVal)) {
                return normUserVal.includes(normReqVal);
            }
            if (typeof normUserVal === "string") {
                return normUserVal
                    .toLowerCase()
                    .includes(String(normReqVal).toLowerCase());
            }
            return false;

        case "in":
            if (!Array.isArray(normReqVal)) {
                return false;
            }
            return normReqVal.includes(normUserVal);

        case "boolean":
            return Boolean(normUserVal) === Boolean(normReqVal);

        default:
            return false;
    }
};

const checkEligibility = (rules, citizenContext = {}) => {
    const confirmed = [];
    const failed = [];
    const unknown = [];

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
        return {
            status: "CONFIRMED",
            confirmed: [],
            failed: [],
            unknown: [],
            percentComplete: 100
        };
    }

    for (const rule of rules) {
        const userValue = citizenContext[rule.field];

        // If field is missing or empty
        if (
            userValue === undefined ||
            userValue === null ||
            userValue === ""
        ) {
            unknown.push({
                field: rule.field,
                description: rule.description || `Field '${rule.field}' is required for eligibility check.`,
                unit: rule.unit,
                sourceId: rule.sourceId
            });
            continue;
        }

        const passed = evaluateRule(userValue, rule.operator, rule.value);

        const evaluatedItem = {
            field: rule.field,
            operator: rule.operator,
            requiredValue: rule.value,
            userValue,
            unit: rule.unit,
            sourceId: rule.sourceId,
            description: rule.description
        };

        if (passed) {
            confirmed.push(evaluatedItem);
        } else {
            failed.push(evaluatedItem);
        }
    }

    let status = "CONFIRMED";
    if (failed.length > 0) {
        status = "FAILED";
    } else if (unknown.length > 0) {
        status = "UNKNOWN"; // Can also represent LIKELY in ranking
    }

    const totalRules = rules.length;
    const knownRules = confirmed.length + failed.length;
    const percentComplete = totalRules > 0 ? Math.round((knownRules / totalRules) * 100) : 100;

    return {
        status,
        confirmed,
        failed,
        unknown,
        percentComplete
    };
};

module.exports = {
    evaluateRule,
    checkEligibility
};
