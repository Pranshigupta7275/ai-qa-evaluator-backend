const IntentDetectionService = require("../services/intent.service");
const CancellationService = require("../services/cancellation.service");
const RefundService = require("../services/refund.service");
const PaymentService = require("../services/payment.service");
const AliasValidationService = require("../services/aliasValidation.service"); // <-- ADDED
const Evaluation = require("../models/Evaluation.model"); // Verify exact casing of your filename here
const logger = require("../config/logger");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

class OrchestratorController {
  
  // ==========================================
  // 1. CREATE EVALUATION (POST)
  // ==========================================
  async analyzeFull(req, res, next) {
    try {
      const { petitionId, conversation , categoryOverride} = req.body;

      // 1. Validate CRM Payload
      if (!petitionId || !Array.isArray(conversation) || conversation.length === 0) {
        throw new ApiError(400, "Valid petitionId and conversation array are required.");
      }

      const discovery = await IntentDetectionService.detectIntentAndCategory(conversation);
      const primaryCategory = categoryOverride || discovery.primaryCategory;

      // 3. Handle Informational Queries
      if (["Policy Inquiry", "General Inquiry"].includes(primaryCategory)) {
        return res.status(200).json(new ApiResponse(200, { pipelineStatus: "Bypassed_QA", discovery }));
      }

      // ---------------------------------------------------------
      // 3.5 DETERMINISTIC VALIDATION: ALIAS QA
      // ---------------------------------------------------------
      const aliasResults = AliasValidationService.validate(conversation);

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

      // ---------------------------------------------------------
      // 4.5 MERGE DETERMINISTIC RESULTS WITH LLM RESULTS
      // ---------------------------------------------------------
      // Ensure QA analysis observations array exists
      if (!qaAnalysis.observations) qaAnalysis.observations = [];

      // Push all deterministic alias observations into the final report
      if (aliasResults && aliasResults.observations) {
        qaAnalysis.observations.push(...aliasResults.observations);
      }

      // (Optional) Mark overall assessment as failed if strict alias violation occurs
      if (!aliasResults.passed) {
         // qaAnalysis.overallAssessment = "Failed"; // Uncomment if business requires automatic failure
      }

      // 5. Unified Data Mapping
      // 5. Unified Data Mapping
      const evaluationData = {
        petitionId,
        chatLogs: conversation.map(c => {
          // Safety check: If the CRM sends a short time like "14:08", Mongoose will crash. 
          // We verify if it can be parsed as a real Date, otherwise fallback to Date.now()
          let safeTimestamp = c.timestamp;
          if (safeTimestamp && isNaN(new Date(safeTimestamp).getTime())) {
            safeTimestamp = new Date(); 
          } else if (!safeTimestamp) {
            safeTimestamp = new Date();
          }

          return {
            speaker: c.speaker || c.role || "Unknown",
            message: c.message || "",
            timestamp: safeTimestamp
          };
        }),
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
          qaAnalysis,
          dbRecordId: evaluationEntry._id // Added this so you get the ID back!
        }, "Evaluation completed and saved.")
      );

    } catch (err) {
      logger.error("Orchestrator Error:", err);
      next(err);
    }
  }

  // ==========================================
  // 2. GET EVALUATIONS (GET)
  // ==========================================
  async getEvaluations(req, res, next) {
    try {
      // Setup pagination and optional filtering
      const { page = 1, limit = 10, petitionId } = req.query;
      const query = petitionId ? { petitionId } : {};

      // Fetch from MongoDB
      const evaluations = await Evaluation.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .exec();

      const count = await Evaluation.countDocuments(query);

      return res.status(200).json(
        new ApiResponse(200, {
          evaluations,
          totalPages: Math.ceil(count / limit),
          currentPage: Number(page),
          totalRecords: count
        }, "Evaluations retrieved successfully")
      );
    } catch (err) {
      logger.error("Error fetching evaluations:", err);
      next(err);
    }
  }
}

module.exports = new OrchestratorController();