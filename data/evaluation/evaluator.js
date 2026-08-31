require("dotenv").config({ path: "../../server/.env" }); // load server environment variables
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const GovernmentService = require("../../server/src/models/GovernmentService");
const GovernmentSource = require("../../server/src/models/GovernmentSource");
const { analyzeProblem } = require("../../server/src/services/government/aiService");
const { rankServices } = require("../../server/src/services/government/recommendationEngine");
const { detectMissingInformation } = require("../../server/src/services/government/missingInfoEngine");

const runEvaluation = async () => {
    console.log("==================================================");
    console.log("   CIVICSPHERE GOV NAVIGATOR EVALUATION PIPELINE  ");
    console.log("==================================================");

    const mongoUri = process.env.MONGODB_URI;
    
    try {
        console.log("Attempting database connection for evaluation data...");
        // Fast timeout to enable instant local fallback
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log("Connected to MongoDB database.");
        global.useDbFallback = false;
    } catch (dbErr) {
        console.warn("\n==================================================");
        console.warn("WARNING: MongoDB Atlas unreachable (likely IP whitelist check).");
        console.warn("Activating Local JSON Database Fallback Mode for evaluation.");
        console.warn("==================================================\n");
        global.useDbFallback = true;
    }

    try {
        // Read test cases
        const datasetPath = path.join(__dirname, "dataset.json");
        if (!fs.existsSync(datasetPath)) {
            console.error(`Evaluation dataset file not found at ${datasetPath}`);
            process.exit(1);
        }

        const cases = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
        console.log(`Loaded ${cases.length} evaluation cases.\n`);

        let passedCount = 0;
        const results = [];
        const startTime = Date.now();

        for (const testCase of cases) {
            console.log(`Evaluating Case [${testCase.id}]: ${testCase.description}...`);
            const caseStart = Date.now();

            // Run Phase 1: Intent extraction
            const analysis = await analyzeProblem(testCase.problem);
            
            const activeContext = {
                ...analysis.inferredContext,
                ...testCase.citizenContext
            };

            // Run Phase 2: Candidate retrieval
            const filter = { verificationStatus: { $ne: "BLOCKED" } };
            if (analysis.category && analysis.category !== "General") {
                filter.categories = { $in: [analysis.category] };
            }
            const targetState = activeContext.state || analysis.state;
            if (targetState) {
                filter.$or = [
                    { state: targetState },
                    { jurisdiction: "central" },
                    { jurisdiction: "All" }
                ];
            }

            let candidates;
            if (global.useDbFallback) {
                const localDb = require("../../server/src/services/government/localDbFallback");
                candidates = localDb.findServices(filter);
            } else {
                candidates = await GovernmentService.find(filter);
            }

            if (candidates.length === 0 && analysis.keywords.length > 0) {
                if (global.useDbFallback) {
                    const localDb = require("../../server/src/services/government/localDbFallback");
                    candidates = localDb.localServices.filter(s => {
                        const content = `${s.serviceName} ${s.description} ${s.keywords.join(" ")}`.toLowerCase();
                        return analysis.keywords.some(kw => content.includes(kw.toLowerCase()));
                    });
                } else {
                    const regexKeywords = analysis.keywords.map(kw => new RegExp(kw, "i"));
                    candidates = await GovernmentService.find({
                        verificationStatus: { $ne: "BLOCKED" },
                        $or: [
                            { serviceName: { $in: regexKeywords } },
                            { keywords: { $in: regexKeywords } }
                        ]
                    });
                }
            }

            // Run Phase 3: Rank
            const ranked = await rankServices(candidates, testCase.problem, activeContext);

            // Run Phase 4: Missing Info
            const clarification = detectMissingInformation(ranked, activeContext);

            // Check expectations
            let isCasePassed = true;
            const failures = [];

            const exp = testCase.expected;

            // 1. Verify category
            if (exp.category && analysis.category !== exp.category) {
                isCasePassed = false;
                failures.push(`Category mismatch (Expected: ${exp.category}, Got: ${analysis.category})`);
            }

            // 2. Verify clarification triggers
            if (exp.needsClarification !== undefined && clarification.needsClarification !== exp.needsClarification) {
                isCasePassed = false;
                failures.push(`Clarification trigger mismatch (Expected: ${exp.needsClarification}, Got: ${clarification.needsClarification})`);
            }

            // 3. Verify clarification fields
            if (exp.clarificationFields) {
                const fieldsInQuestions = clarification.questions.map(q => q.field);
                for (const f of exp.clarificationFields) {
                    if (!fieldsInQuestions.includes(f)) {
                        isCasePassed = false;
                        failures.push(`Missing clarification question for field: ${f}`);
                    }
                }
            }

            // 4. Verify best matched service
            if (exp.bestServiceId) {
                const topCandidate = ranked[0];
                if (!topCandidate || topCandidate.service.serviceId !== exp.bestServiceId) {
                    isCasePassed = false;
                    failures.push(`Recommendation mismatch (Expected top service: ${exp.bestServiceId}, Got: ${topCandidate ? topCandidate.service.serviceId : 'None'})`);
                }
            }

            // 5. Verify jurisdiction mismatch filters
            if (exp.jurisdictionMismatch) {
                const stateService = ranked.find(c => c.service.state === "Maharashtra");
                if (stateService && stateService.components.jurisdictionMatch > 0) {
                    isCasePassed = false;
                    failures.push(`Jurisdiction checker failed to block out mismatching state (${stateService.service.serviceName} gave jurisdiction score > 0)`);
                }
            }

            // 6. Adversarial injection mitigation check
            if (exp.isAdversarial && testCase.problem.includes("http")) {
                if (analysis.isAiResolved && JSON.stringify(analysis).includes("scam-link.com")) {
                    isCasePassed = false;
                    failures.push("Security safeguard failed: Model resolved adversarial prompt payload.");
                }
            }

            const latency = Date.now() - caseStart;
            if (isCasePassed) passedCount++;

            results.push({
                id: testCase.id,
                description: testCase.description,
                passed: isCasePassed,
                latency,
                failures: failures.length > 0 ? failures.join("; ") : "None"
            });
        }

        const totalTime = Date.now() - startTime;
        const successRate = (passedCount / cases.length) * 100;

        console.log("\n==================================================");
        console.log("               EVALUATION RESULTS                 ");
        console.log("==================================================");
        console.log(`Passed Cases: ${passedCount} / ${cases.length} (${successRate.toFixed(2)}%)`);
        console.log(`Total Latency: ${totalTime}ms (Avg: ${(totalTime / cases.length).toFixed(1)}ms per case)`);
        console.log("==================================================");
        
        console.table(results.map(r => ({
            Case: r.id,
            Passed: r.passed ? "✓ PASS" : "❌ FAIL",
            "Latency (ms)": r.latency,
            Detail: r.failures
        })));

        if (!global.useDbFallback) {
            await mongoose.disconnect();
            console.log("\nDisconnected from database.");
        }
    } catch (error) {
        console.error("Evaluation Script Failed:", error.stack);
        process.exit(1);
    }
};

runEvaluation();
