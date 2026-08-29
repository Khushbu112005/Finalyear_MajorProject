const { evaluateRule, checkEligibility } = require("../src/services/government/eligibilityEngine");

describe("Eligibility Rules Engine Unit Tests", () => {
    
    describe("Individual Operator Evaluations", () => {
        test("equals operator", () => {
            expect(evaluateRule("Farmer", "equals", "Farmer")).toBe(true);
            expect(evaluateRule("Student", "equals", "Farmer")).toBe(false);
            expect(evaluateRule("true", "equals", true)).toBe(true);
        });

        test("not_equals operator", () => {
            expect(evaluateRule("Farmer", "not_equals", "Student")).toBe(true);
            expect(evaluateRule("Farmer", "not_equals", "Farmer")).toBe(false);
        });

        test("greater_than operator", () => {
            expect(evaluateRule(25, "greater_than", 18)).toBe(true);
            expect(evaluateRule("25", "greater_than", "18")).toBe(true);
            expect(evaluateRule(15, "greater_than", 18)).toBe(false);
        });

        test("less_than operator", () => {
            expect(evaluateRule(17, "less_than", 18)).toBe(true);
            expect(evaluateRule(20, "less_than", 18)).toBe(false);
        });

        test("greater_than_or_equal operator", () => {
            expect(evaluateRule(18, "greater_than_or_equal", 18)).toBe(true);
            expect(evaluateRule(19, "greater_than_or_equal", 18)).toBe(true);
            expect(evaluateRule(17, "greater_than_or_equal", 18)).toBe(false);
        });

        test("less_than_or_equal operator", () => {
            expect(evaluateRule(18, "less_than_or_equal", 18)).toBe(true);
            expect(evaluateRule(17, "less_than_or_equal", 18)).toBe(true);
            expect(evaluateRule(19, "less_than_or_equal", 18)).toBe(false);
        });

        test("contains operator", () => {
            expect(evaluateRule(["Aadhaar", "Pan"], "contains", "Aadhaar")).toBe(true);
            expect(evaluateRule("Education Scheme", "contains", "Education")).toBe(true);
            expect(evaluateRule(["Aadhaar"], "contains", "Pan")).toBe(false);
        });

        test("in operator", () => {
            expect(evaluateRule("Aadhaar", "in", ["Aadhaar", "Pan"])).toBe(true);
            expect(evaluateRule("Passport", "in", ["Aadhaar"])).toBe(false);
        });

        test("boolean operator", () => {
            expect(evaluateRule(true, "boolean", true)).toBe(true);
            expect(evaluateRule("true", "boolean", true)).toBe(true);
            expect(evaluateRule("false", "boolean", false)).toBe(true);
            expect(evaluateRule(true, "boolean", false)).toBe(false);
        });
    });

    describe("Full Rules Checklist Evaluation", () => {
        const rules = [
            { field: "age", operator: "greater_than_or_equal", value: 18, description: "Age must be >= 18" },
            { field: "state", operator: "equals", value: "Maharashtra", description: "Must live in Maharashtra" },
            { field: "annualIncome", operator: "less_than_or_equal", value: 200000, description: "Income must be <= 2L" }
        ];

        test("All rules confirmed -> ELIGIBLE", () => {
            const context = { age: 20, state: "Maharashtra", annualIncome: 150000 };
            const result = checkEligibility(rules, context);
            
            expect(result.status).toBe("CONFIRMED");
            expect(result.confirmed.length).toBe(3);
            expect(result.failed.length).toBe(0);
            expect(result.unknown.length).toBe(0);
            expect(result.percentComplete).toBe(100);
        });

        test("Any rule failed -> NOT_ELIGIBLE (FAILED)", () => {
            const context = { age: 17, state: "Maharashtra", annualIncome: 150000 }; // age fails
            const result = checkEligibility(rules, context);
            
            expect(result.status).toBe("FAILED");
            expect(result.confirmed.length).toBe(2);
            expect(result.failed.length).toBe(1);
            expect(result.unknown.length).toBe(0);
        });

        test("Missing inputs -> UNKNOWN", () => {
            const context = { age: 20, state: "Maharashtra" }; // annualIncome missing
            const result = checkEligibility(rules, context);
            
            expect(result.status).toBe("UNKNOWN");
            expect(result.confirmed.length).toBe(2);
            expect(result.failed.length).toBe(0);
            expect(result.unknown.length).toBe(1);
            expect(result.unknown[0].field).toBe("annualIncome");
            expect(result.percentComplete).toBe(67);
        });
    });
});
