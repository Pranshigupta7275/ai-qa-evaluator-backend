const IntentDetectionService = require('../services/intent.service');
const CancellationService = require('../services/cancellation.service');
const RefundService = require('../services/refund.service'); 
const ScoringService = require('../services/scoring.service');
const logger = require('../config/logger');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class OrchestratorController {
  async analyzeFull(req, res, next) {
    const startTime = Date.now();
    try {
      // ==========================================
      // DEBUG: Verify Express/Postman Connection
      // ==========================================
      console.log("--- DEBUG START ---");
      console.log("Postman Content-Type Header:", req.headers['content-type']);
      console.log("Parsed Body Type:", typeof req.body);
      console.log("Parsed Body Content:", JSON.stringify(req.body, null, 2));
      console.log("--- DEBUG END ---");

      const { conversation } = req.body;

      // ==========================================
      // INPUT VALIDATION
      // ==========================================
      if (!conversation || !Array.isArray(conversation)) {
        throw new ApiError(400, 'A valid conversation array is required.', 'BAD_REQUEST');
      }

      // ==========================================
      // STEP 1: HYBRID INTENT ROUTING
      // ==========================================
      const discovery = await IntentDetectionService.detectIntentAndCategory(conversation);
      const { primaryCategory, routingSource } = discovery;

      logger.info(`Orchestrator routed conversation to: ${primaryCategory} (via ${routingSource || 'Unknown Source'})`);

      // ==========================================
      // STEP 2: HANDLE INFORMATIONAL QUERIES 
      // (Zero LLM Cost Bypasses)
      // ==========================================
      if (primaryCategory === 'Wrong_Identification') {
         return res.status(200).json(new ApiResponse(200, {
           pipelineStatus: 'Bypassed_QA',
           processingTimeMs: Date.now() - startTime,
           discovery,
           qaReport: {
             category: 'Wrong_Identification',
             observationNote: 'Informational policy inquiry. No operational QA evaluation required.',
             errorIdentified: 'None',
             errorReason: 'N/A'
           },
           performanceScore: {
             finalScore: null,
             grade: 'N/A',
             breakdown: { errorFlagged: 'None' }
           }
         }, 'Informational query bypassed QA evaluation to save API costs.'));
      }
      
      // ==========================================
      // STEP 3: HANDLE UNKNOWN INTENTS
      // ==========================================
      if (primaryCategory === 'Unknown') {
         return res.status(200).json(new ApiResponse(200, {
           pipelineStatus: 'Skipped',
           processingTimeMs: Date.now() - startTime,
           discovery,
           qaReport: null,
           performanceScore: null
         }, 'Conversation intent could not be classified. Skipped QA.'));
      }

      // ==========================================
      // STEP 4: OPERATIONAL QA EVALUATION
      // ==========================================
      let qaReport;
      
      if (primaryCategory === 'Cancellation') {
        qaReport = await CancellationService.evaluate(conversation);
      } 
      else if (primaryCategory === 'Refund') {
        qaReport = await RefundService.evaluateRefund(conversation);
      }
      else {
        throw new ApiError(501, `Evaluator for category '${primaryCategory}' is not yet implemented.`);
      }

      
      const performanceScore = ScoringService.calculateScore(qaReport);
      const processingTimeMs = Date.now() - startTime;

      return res.status(200).json(new ApiResponse(200, {
        pipelineStatus: 'Complete',
        processingTimeMs,
        discovery,
        qaReport,
        performanceScore
      }, 'Full conversation evaluation pipeline completed.'));

    } catch (error) {
      logger.error('Orchestrator Pipeline Error:', error);
      next(error);
    }
  }
}

module.exports = new OrchestratorController();