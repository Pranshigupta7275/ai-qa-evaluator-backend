const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema({
    // CRM Reference (Essential for linking AI evaluations to real Zendesk/Salesforce tickets)
    petitionId: {
        type: String,
        required: true,
        index: true
    },

    // Conversation (Preserves context so managers can read the chat without leaving the dashboard)
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

    // Coaching / Recommendations for the agent
    recommendations: [String]

}, {
    // Automatically adds createdAt and updatedAt fields to every document
    timestamps: true
});

module.exports = mongoose.model("Evaluation", EvaluationSchema);