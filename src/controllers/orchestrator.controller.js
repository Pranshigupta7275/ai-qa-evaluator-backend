const IntentDetectionService = require("../services/intent.service");
const CancellationService = require("../services/cancellation.service");
const RefundService = require("../services/refund.service");
const PaymentService = require("../services/payment.service");
const Evaluation = require("../models/Evaluation.model");
const logger = require("../config/logger");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

class OrchestratorController {
  async analyzeFull(req, res, next) {
    try {
      const { petitionId, conversation } = req.body;

      // 1. Validate CRM Payload
      if (!petitionId || !Array.isArray(conversation) || conversation.length === 0) {
        throw new ApiError(400, "Valid petitionId and conversation array are required.");
      }

      // 2. Intent Detection
      const discovery = await IntentDetectionService.detectIntentAndCategory(conversation);
      const { primaryCategory } = discovery;

      // 3. Handle Informational Queries
      if (["Policy Inquiry", "General Inquiry"].includes(primaryCategory)) {
        return res.status(200).json(new ApiResponse(200, { pipelineStatus: "Bypassed_QA", discovery }));
      }

      // 4. QA Evaluation Routing
      let qaAnalysis;
      switch (primaryCategory) {
        case "Cancellation":
          qaAnalysis = await CancellationService.evaluate(conversation);
          break;
        case "Refund":
          qaAnalysis = await RefundService.evaluateRefund(conversation);
          break;
        case "Payment Verification":
          qaAnalysis = await PaymentService.evaluate(conversation);
          break;
        default:
          throw new ApiError(501, `No evaluator implemented for category: ${primaryCategory}`);
      }

      // 5. Unified Data Mapping (Matches Schema perfectly)
      // Standardizing field names here ensures no data loss
      const evaluationData = {
        petitionId,
        chatLogs: conversation.map(c => ({
          speaker: c.role || "Unknown",
          message: c.message || "",
          timestamp: c.timestamp || new Date() // Falls back to server time if CRM time is missing
        })),
        overallAssessment: qaAnalysis.overallAssessment,
        findings: (qaAnalysis.findings || []).map(f => ({
          severity: f.severity,
          errorType: f.errorType,
          issue: f.issue,
          rootCause: f.rootCause,
          impact: f.impact,
          expectedBehaviour: f.expectedBehaviour,
          evidence: {
            customer: f.evidence?.customer || "N/A",
            agent: f.evidence?.agent || "N/A"
          }
        })),
        observations: qaAnalysis.observations || [],
        recommendations: qaAnalysis.recommendations || []
      };

      // 6. Persistence
      const evaluationEntry = await Evaluation.create(evaluationData);
      logger.info(`Evaluation saved: ${evaluationEntry._id}`);

      // 7. Success Response
      return res.status(200).json(
        new ApiResponse(200, {
          pipelineStatus: "Complete",
          discovery,
          qaAnalysis
        }, "Evaluation completed and saved.")
      );

    } catch (err) {
      logger.error("Orchestrator Error:", err);
      next(err);
    }
  }
}

module.exports = new OrchestratorController();