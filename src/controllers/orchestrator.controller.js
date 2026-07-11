const IntentDetectionService = require("../services/intent.service");
const CancellationService = require("../services/cancellation.service");
const RefundService = require("../services/refund.service");
const PaymentService = require("../services/payment.service");
const logger = require("../config/logger");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

class OrchestratorController {
  async analyzeFull(req, res, next) {
    const startTime = Date.now();

    try {
      // ==========================================
      // DEBUGGING: INCOMING REQUEST
      // ==========================================
      console.log("\n========== 🚨 NEW REQUEST RECEIVED 🚨 ==========");
      console.log("1. RAW req.body from Postman:");
      console.log(JSON.stringify(req.body, null, 2)); // This will print exactly what Express sees!

      logger.info("========== Incoming Request ==========");
      logger.info(JSON.stringify(req.body, null, 2));

      const conversation = req.body?.conversation;

      console.log("2. Extracted 'conversation' property:");
      console.log(conversation); 

      // VALIDATION
      if (!Array.isArray(conversation) || conversation.length === 0) {
        console.log("❌ ERROR: Validation failed! conversation is either missing, not an array, or empty.");
        throw new ApiError(
          400,
          "A valid conversation array is required.",
          "BAD_REQUEST"
        );
      }

      console.log("✅ Validation passed. Sending to Intent Router...");

      // STEP 1 - Intent Detection
      const discovery = await IntentDetectionService.detectIntentAndCategory(conversation);
      const { primaryCategory, routingSource } = discovery;

      console.log(`3. 🎯 Intent Detected: ${primaryCategory} (via ${routingSource})`);
      logger.info(`Intent detected: ${primaryCategory} (${routingSource || "Unknown"})`);

      // STEP 2 - Informational Queries
      if (
        primaryCategory === "Policy Inquiry" ||
        primaryCategory === "General Inquiry"
      ) {
        console.log("⏩ Bypassing QA (Informational Query)");
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              pipelineStatus: "Bypassed_QA",
              processingTimeMs: Date.now() - startTime,
              discovery,
              qaAnalysis: {
                overallAssessment: "This conversation was informational only. No QA evaluation was required.",
                sopAssessment: [],
                criticalFindings: [],
                coachingFeedback: [],
                category: primaryCategory,
              },
            },
            "Informational query bypassed QA evaluation."
          )
        );
      }

      // STEP 3 - Unknown Intent
      if (primaryCategory === "Unknown") {
        console.log("⚠️ Unknown intent. Skipping evaluation.");
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              pipelineStatus: "Skipped",
              processingTimeMs: Date.now() - startTime,
              discovery,
              qaAnalysis: null,
            },
            "Unable to classify conversation."
          )
        );
      }

      // STEP 4 - QA Evaluation
      console.log(`4. ⚙️ Routing to QA Evaluator for: ${primaryCategory}`);
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
          console.log(`❌ ERROR: No service built yet for ${primaryCategory}`);
          throw new ApiError(
            501,
            `No evaluator implemented for ${primaryCategory}.`
          );
      }

      console.log("✅ QA Evaluation Complete! Sending response to Postman.\n");

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            pipelineStatus: "Complete",
            processingTimeMs: Date.now() - startTime,
            discovery,
            qaAnalysis,
          },
          "Full conversation evaluation pipeline completed."
        )
      );
    } catch (err) {
      console.error("💥 CAUGHT ERROR IN ORCHESTRATOR:");
      console.error(err.message);
      logger.error(err.stack || err.message);
      next(err);
    }
  }
}

module.exports = new OrchestratorController();