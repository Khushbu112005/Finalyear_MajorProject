require("dotenv").config();

const mongoose = require("mongoose");

const GovernmentService =
    require("./models/GovernmentService");

const createTestService = async () => {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("MongoDB connected.");

        const service =
            await GovernmentService.create({

                serviceName:
                    "Eligibility Engine Test Service",

                serviceType:
                    "Development Test",

                description:
                    "Development-only service for testing the eligibility engine.",

                department:
                    "CivicSphere Development",

                jurisdiction:
                    "central",

                categories: [
                    "testing"
                ],

                keywords: [
                    "eligibility test"
                ],

                eligibilityRules: [

                    {
                        field: "age",

                        operator:
                            "greater_than_or_equal",

                        value: 18,

                        description:
                            "Applicant must be at least 18 years old."
                    },

                    {
                        field: "annualIncome",

                        operator:
                            "less_than_or_equal",

                        value: 300000,

                        description:
                            "Annual household income must not exceed ₹3,00,000."
                    }

                ],

                requiredDocuments: [],

                procedureSteps: [],

                applicationMethods: [
                    "Online"
                ],

                verificationStatus:
                    "UNVERIFIED",

                confidence: 0

            });

        console.log(
            "Test service created:"
        );

        console.log(service._id);

        await mongoose.disconnect();

        console.log(
            "Database connection closed."
        );

    } catch (error) {

        console.error(
            "Error:",
            error.message
        );

        process.exit(1);
    }
};

createTestService();