const QUESTIONS_REGISTRY = {
    state: {
        question: "Which state do you currently reside in?",
        reason: "The availability and eligibility criteria for this service vary by state."
    },
    district: {
        question: "Which district do you reside in?",
        reason: "Some schemes are local to specific districts or administrative divisions."
    },
    annualIncome: {
        question: "What is your family's annual household income?",
        reason: "Many services are income-restricted, and we need to check if you fall within the limit."
    },
    age: {
        question: "What is your age in years?",
        reason: "This scheme is age-dependent with strict minimum or maximum requirements."
    },
    gender: {
        question: "What is your gender?",
        reason: "This program has custom eligibility rules or benefits targeting specific genders."
    },
    employmentStatus: {
        question: "What is your current employment status?",
        reason: "Certain support programs are only available to unemployed individuals, farmers, or daily wage workers."
    },
    studentStatus: {
        question: "Are you currently enrolled as a student?",
        reason: "This educational benefit requires active student enrollment."
    },
    disabilityStatus: {
        question: "Do you have a certified disability?",
        reason: "This assistance is designated for differently-abled citizens."
    },
    socialCategory: {
        question: "What is your social category (e.g., General, SC, ST, OBC)?",
        reason: "Relaxations in income, age, or specific benefits are offered based on category."
    },
    ruralUrban: {
        question: "Do you live in a rural or urban area?",
        reason: "Some schemes target rural developments while others are for urban citizens."
    },
    maritalStatus: {
        question: "What is your marital status?",
        reason: "Family and marital context (e.g. widow, single parent) affects eligibility."
    }
};

const detectMissingInformation = (rankedCandidates, citizenContext = {}) => {
    const missingCounts = {};
    const fieldReasons = {};

    // Only inspect top candidates (e.g. overallScore >= 0.40) to determine relevant missing fields
    const relevantCandidates = rankedCandidates.filter(c => c.overallScore >= 0.35);
    
    // If no candidates are reasonably relevant, inspect all candidates to find gaps
    const candidatesToInspect = relevantCandidates.length > 0 ? relevantCandidates : rankedCandidates.slice(0, 5);

    for (const candidate of candidatesToInspect) {
        const unknownFields = candidate.eligibility.unknown;
        for (const rule of unknownFields) {
            const field = rule.field;
            missingCounts[field] = (missingCounts[field] || 0) + 1;
            
            if (!fieldReasons[field]) {
                fieldReasons[field] = new Set();
            }
            if (candidate.service.serviceName) {
                fieldReasons[field].add(candidate.service.serviceName);
            }
        }
    }

    // Convert to sorted array of missing fields
    const missingFields = Object.keys(missingCounts).map(field => {
        const count = missingCounts[field];
        const servicesList = Array.from(fieldReasons[field] || []);
        
        let questionData = QUESTIONS_REGISTRY[field];
        if (!questionData) {
            questionData = {
                question: `Could you please verify your '${field}'?`,
                reason: `This information helps clarify eligibility for: ${servicesList.slice(0, 2).join(", ")}.`
            };
        } else {
            // Customize reason slightly to highlight which services need it
            if (servicesList.length > 0) {
                questionData = {
                    ...questionData,
                    reason: `${questionData.reason} (Needed for: ${servicesList.slice(0, 2).join(", ")})`
                };
            }
        }

        return {
            field,
            count,
            question: questionData.question,
            reason: questionData.reason
        };
    });

    // Sort by count descending (high-value first)
    missingFields.sort((a, b) => b.count - a.count);

    // If there are critical missing fields, we ask for clarification.
    // We cap it at 3 questions to avoid user fatigue.
    const needsClarification = missingFields.length > 0;
    const questions = missingFields.slice(0, 3).map(q => ({
        field: q.field,
        question: q.question,
        reason: q.reason
    }));

    return {
        needsClarification,
        questions
    };
};

module.exports = {
    detectMissingInformation,
    QUESTIONS_REGISTRY
};
