const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema({
    // CRM Reference
    petitionId: {
        type: String,
        required: true,
        index: true
    },

    // Conversation Context
    chatLogs: [
        {
            speaker: String, // Customer | Agent
            message: String,
            timestamp: Date
        }
    ],

    // Overall QA Summary
    overallAssessment: String,

    // Errors identified by the AI
    findings: [{
        severity: {
            type: String,
            enum: ["Critical", "High", "Medium", "Low"]
        },
        errorType: String,
        issue: String,
        evidence: {
            customer: String,
            agent: String
        }
    }],

    // Good things the agent did
    observations: [String],

    // Coaching / Recommendations
    recommendations: [String]

}, {
    timestamps: true
});

module.exports = mongoose.model("Evaluation", EvaluationSchema, "queryreports");