const mongoose = require("mongoose");

const eligibilityRuleSchema = new mongoose.Schema(
    {
        field: {
            type: String,
            required: true
        },

        operator: {
            type: String,
            enum: [
                "equals",
                "not_equals",
                "greater_than",
                "less_than",
                "greater_than_or_equal",
                "less_than_or_equal",
                "contains",
                "in",
                "boolean"
            ],
            required: true
        },

        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        unit: {
            type: String
        },

        sourceId: {
            type: String
        },

        description: {
            type: String
        }
    },
    { _id: false }
);

const documentSchema = new mongoose.Schema(
    {
        documentId: {
            type: String,
            required: true
        },

        documentName: {
            type: String,
            required: true
        },

        name: {
            type: String // for backward compatibility
        },

        required: {
            type: Boolean,
            default: true // for backward compatibility
        },

        isMandatory: {
            type: Boolean,
            default: true
        },

        sourceId: {
            type: String
        },

        description: {
            type: String
        }
    },
    { _id: false }
);

const procedureStepSchema = new mongoose.Schema(
    {
        stepNumber: {
            type: Number,
            required: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        action: {
            type: String
        },

        requiredInput: [
            {
                type: String
            }
        ],

        sourceId: {
            type: String
        },

        completionState: {
            type: String,
            default: "Pending"
        }
    },
    { _id: false }
);

const grievanceRouteSchema = new mongoose.Schema(
    {
        authority: String,
        description: String,
        url: String,
        portal: String,
        contact: String
    },
    { _id: false }
);

const appealRouteSchema = new mongoose.Schema(
    {
        authority: String,
        description: String,
        url: String
    },
    { _id: false }
);

const governmentServiceSchema = new mongoose.Schema(
    {
        serviceId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        serviceName: {
            type: String,
            required: true,
            trim: true
        },

        serviceType: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        department: {
            type: String,
            required: true
        },

        ministry: {
            type: String
        },

        authority: {
            type: String
        },

        jurisdiction: {
            type: String,
            enum: [
                "central",
                "state",
                "district",
                "local",
                "All"
            ],
            required: true
        },

        state: {
            type: String
        },

        district: {
            type: String
        },

        categories: [
            {
                type: String
            }
        ],

        keywords: [
            {
                type: String
            }
        ],

        targetBeneficiaries: [
            {
                type: String
            }
        ],

        eligibilityRules: [
            eligibilityRuleSchema
        ],

        requiredDocuments: [
            documentSchema
        ],

        procedureSteps: [
            procedureStepSchema
        ],

        applicationMethods: [
            {
                type: String
            }
        ],

        officialPortal: {
            title: String,
            url: String,
            verified: {
                type: Boolean,
                default: false
            }
        },

        officialSources: [
            {
                type: String
            }
        ],

        // Kept for backward compatibility
        sources: [
            {
                title: String,
                url: String,
                sourceType: String,
                verified: Boolean,
                lastVerified: Date
            }
        ],

        grievanceRoute: grievanceRouteSchema,

        appealRoute: appealRouteSchema,

        fees: {
            type: String
        },

        deadlines: {
            type: String
        },

        processingTime: {
            type: String
        },

        lastVerified: {
            type: Date
        },

        sourceVersion: {
            type: String,
            default: "1.0.0"
        },

        verificationStatus: {
            type: String,
            enum: [
                "ACTIVE",
                "SUPERSEDED",
                "EXPIRED",
                "UNVERIFIED",
                "BLOCKED"
            ],
            default: "UNVERIFIED"
        },

        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Indexes for faster searching
governmentServiceSchema.index({
    serviceId: 1
});

governmentServiceSchema.index({
    serviceName: "text",
    description: "text",
    keywords: "text",
    categories: "text"
});

governmentServiceSchema.index({
    state: 1
});

governmentServiceSchema.index({
    department: 1
});

governmentServiceSchema.index({
    verificationStatus: 1
});

governmentServiceSchema.index({
    lastVerified: 1
});

module.exports = mongoose.model(
    "GovernmentService",
    governmentServiceSchema
);