const IntentDetectionService = require("../services/intent.service");
const CancellationService = require("../services/cancellation.service");
const RefundService = require("../services/refund.service");
const PaymentService = require("../services/payment.service");
const AliasValidationService = require("../services/aliasValidation.service");
const baggageService = require('../services/baggage.service');
const bookingService = require('../services/booking.service');
const rescheduleService = require('../services/reschedule.service');
const checkinService = require('../services/checkin.service');
// FIXED: Lowercase 'e' for Linux deployment compatibility
const Evaluation = require("../models/evaluation.model"); 
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

      if (!petitionId || !Array.isArray(conversation) || conversation.length === 0) {
        throw new ApiError(400, "Valid petitionId and conversation array are required.");
      }

      const discovery = await IntentDetectionService.detectIntentAndCategory(conversation);
      const primaryCategory = categoryOverride || discovery.primaryCategory;

      if (["Policy Inquiry", "General Inquiry"].includes(primaryCategory)) {
        return res.status(200).json(new ApiResponse(200, { pipelineStatus: "Bypassed_QA", discovery }));
      }

      const aliasResults = AliasValidationService.validate(conversation);

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
          
        case "Baggage":
        case "Baggage Delay":
          qaAnalysis = await baggageService.evaluate(conversation);
          break;
        case "Booking":
        case "Ticketing":
          qaAnalysis = await bookingService.evaluate(conversation);
          break;

        case "Reschedule":
        case "Name Change":
          qaAnalysis = await rescheduleService.evaluate(conversation);
          break;
          case "Check-in":
          qaAnalysis = await checkinService.evaluate(conversation);
          break;
        default:
          throw new ApiError(501, `No evaluator implemented for category: ${primaryCategory}`);
      }

      // Math & Alias Merge Logic
      const sopAssessment = qaAnalysis.sopAssessment || [];
      const passedCount = sopAssessment.filter(r => r.status === 'PASS').length;
      const failedCount = sopAssessment.filter(r => r.status === 'FAIL').length;
      const notObservedCount = sopAssessment.filter(r => r.status === 'NOT OBSERVED').length;

      const totalObserved = passedCount + failedCount;
      let finalScore = 100;
      if (totalObserved > 0) {
          finalScore = Math.round((passedCount / totalObserved) * 100);
      } else if (totalObserved === 0 && failedCount === 0 && passedCount === 0) {
          finalScore = 0; 
      }

      const findingsArray = qaAnalysis.criticalFindings || qaAnalysis.findings || [];
      if (!qaAnalysis.observations) qaAnalysis.observations = [];

      if (aliasResults && aliasResults.observations) {
        qaAnalysis.observations.push(...aliasResults.observations);
      }

      if (!aliasResults.passed) {
          finalScore = Math.max(0, finalScore - 20); 
          aliasResults.observations.forEach(obs => {
              if (obs.status === 'Failed') {
                  findingsArray.push({
                      severity: "High",
                      errorType: "COMPLIANCE_VIOLATION", 
                      issue: "Agent Alias Mismatch",
                      rootCause: obs.observation,
                      impact: "Breach of company identity protocol.",
                      expectedBehaviour: "The agent must strictly introduce themselves using their system-assigned name.",
                      evidence: { 
                          customer: "N/A",
                          agent: obs.chatEvidence || "No evidence provided" 
                      }
                  });
              }
          });
      }

      let finalGrade = "Excellent";
      if (finalScore < 90) finalGrade = "Good";
      if (finalScore < 80) finalGrade = "Fair";
      if (finalScore < 70) finalGrade = "Poor";

      qaAnalysis.qaScore = {
          score: finalScore,
          grade: finalGrade,
          passedRules: passedCount,
          failedRules: failedCount,
          notObserved: notObservedCount
      };
      
      qaAnalysis.findings = findingsArray;
      qaAnalysis.criticalFindings = findingsArray;

      const evaluationData = {
        petitionId,
        chatLogs: conversation.map(c => {
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
        findings: findingsArray,
        observations: qaAnalysis.observations || [],
        recommendations: qaAnalysis.recommendations || []
      };

      const evaluationEntry = await Evaluation.create(evaluationData);
      logger.info(`Evaluation saved: ${evaluationEntry._id}`);

      // ==========================================
      // OVERRIDE FIX: Build the final discovery object 
      // ==========================================
      const finalDiscovery = {
        ...discovery,
        primaryCategory: primaryCategory,
        routingSource: categoryOverride ? "Manual_Override" : discovery.routingSource
      };

      return res.status(200).json(
        new ApiResponse(200, {
          pipelineStatus: "Complete",
          discovery: finalDiscovery,
          qaAnalysis,
          dbRecordId: evaluationEntry._id
        }, "Evaluation completed and saved.")
      );

    } catch (err) {
      logger.error("Orchestrator Error:", err);
      next(err);
    }
  }

  // ==========================================
  // 2. GET EVALUATIONS (GET) - FIXED: This was missing!
  // ==========================================
  async getEvaluations(req, res, next) {
    try {
      const { page = 1, limit = 10, petitionId } = req.query;
      const query = petitionId ? { petitionId } : {};

      const evaluations = await Evaluation.find(query)
        .sort({ createdAt: -1 }) 
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