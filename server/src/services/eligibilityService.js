const evaluateRule = (userValue, operator, requiredValue) => {

    switch (operator) {

        case "equals":
            return userValue === requiredValue;

        case "not_equals":
            return userValue !== requiredValue;

        case "greater_than":
            return userValue > requiredValue;

        case "less_than":
            return userValue < requiredValue;

        case "greater_than_or_equal":
            return userValue >= requiredValue;

        case "less_than_or_equal":
            return userValue <= requiredValue;

        case "contains":
            if (Array.isArray(userValue)) {
                return userValue.includes(requiredValue);
            }

            if (typeof userValue === "string") {
                return userValue
                    .toLowerCase()
                    .includes(String(requiredValue).toLowerCase());
            }

            return false;

        case "in":
            if (!Array.isArray(requiredValue)) {
                return false;
            }

            return requiredValue.includes(userValue);

        default:
            return false;
    }
};


const checkEligibility = (rules, userProfile) => {

    const results = [];

    let missingInformation = [];

    let failedRules = [];

    for (const rule of rules) {

        const userValue = userProfile[rule.field];

        // Information is missing
        if (
            userValue === undefined ||
            userValue === null ||
            userValue === ""
        ) {

            missingInformation.push({
                field: rule.field,
                description:
                    rule.description ||
                    `Information required: ${rule.field}`
            });

            results.push({
                field: rule.field,
                status: "MISSING",
                description: rule.description
            });

            continue;
        }

        const passed = evaluateRule(
            userValue,
            rule.operator,
            rule.value
        );

        if (passed) {

            results.push({
                field: rule.field,
                status: "PASSED",
                userValue,
                requiredValue: rule.value,
                description: rule.description
            });

        } else {

            failedRules.push({
                field: rule.field,
                userValue,
                requiredValue: rule.value,
                description: rule.description
            });

            results.push({
                field: rule.field,
                status: "FAILED",
                userValue,
                requiredValue: rule.value,
                description: rule.description
            });
        }
    }


    let status;

    if (failedRules.length > 0) {

        status = "NOT_ELIGIBLE";

    } else if (missingInformation.length > 0) {

        status = "NEEDS_INFORMATION";

    } else {

        status = "ELIGIBLE";
    }


    return {
        status,
        results,
        missingInformation,
        failedRules
    };
};


module.exports = {
    checkEligibility
};