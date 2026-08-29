const mongoose = require("mongoose");

const governmentSourceSchema = new mongoose.Schema(
    {
        sourceId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        publisher: {
            type: String,
            trim: true
        },

        organization: {
            type: String,
            trim: true
        },

        url: {
            type: String,
            required: true,
            trim: true
        },

        officialUrl: {
            type: String,
            trim: true
        },

        sourceType: {
            type: String,
            enum: [
                "LEGISLATION",
                "MINISTRY_PORTAL",
                "STATE_PORTAL",
                "AUTHORITY_NOTIF",
                "SECONDARY_TRUSTED",
                "SECONDARY_UNTRUSTED",
                "central_government",
                "state_government",
                "official_department",
                "official_authority",
                "secondary"
            ],
            required: true
        },

        jurisdiction: {
            type: String,
            enum: [
                "central",
                "state",
                "district",
                "local"
            ],
            required: true
        },

        department: {
            type: String,
            trim: true
        },

        state: {
            type: String
        },

        publicationDate: {
            type: Date
        },

        effectiveDate: {
            type: Date
        },

        expiryDate: {
            type: Date
        },

        retrievedAt: {
            type: Date,
            default: Date.now
        },

        contentHash: {
            type: String
        },

        version: {
            type: String,
            default: "1.0.0"
        },

        verified: {
            type: Boolean,
            default: false
        },

        lastVerified: {
            type: Date
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
            default: "ACTIVE"
        },

        verificationNotes: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

governmentSourceSchema.index({
    sourceId: 1
});

governmentSourceSchema.index({
    organization: 1
});

governmentSourceSchema.index({
    jurisdiction: 1
});

governmentSourceSchema.index({
    verified: 1
});

module.exports = mongoose.model(
    "GovernmentSource",
    governmentSourceSchema
);