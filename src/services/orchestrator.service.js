const intentService = require('./intent.service');
const cancellationService = require('./cancellation.service');
const refundService = require('./refund.service'); 
const scoringService = require('./scoring.service'); // Deterministic Scoring Service
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

class OrchestratorService {
  async runFullPipeline(conversation) {
    if (!Array.isArray(conversation) || conversation.length === 0) {
      throw new ApiError(400, 'A valid conversation array is required.', 'BAD_REQUEST');
    }

    const startTime = Date.now();
    logger.info('Starting Full AI Evaluation Pipeline...');

    try {
      // --------------------------------------------------------
      // STAGE 1: Discovery (Intent & Category)
      // --------------------------------------------------------
      const discoveryData = await intentService.detectIntentAndCategory(conversation);
      
      // Extract the detected category safely. 
      // Ensure it maps to your frontend tabs (Refund, Cancellation, etc.)
      const categoryName = discoveryData.category?.name || discoveryData.primaryCategory || 'Unknown';
      
      let evaluationData = null;
      let pipelineStatus = 'Complete';

      // --------------------------------------------------------
      // STAGE 2: Dynamic QA Routing
      // --------------------------------------------------------
      switch (categoryName) {
        case 'Cancellation':
          logger.info('Routing to Cancellation Evaluator...');
          evaluationData = await cancellationService.evaluate(conversation, categoryName);
          break;

        case 'Refund':
          logger.info('Routing to Refund Evaluator...');
          evaluationData = await refundService.evaluate(conversation); 
          break;

        // Add future operational categories here (Baggage, Reschedule, Booking, etc.)
        default:
          logger.info(`No specific QA evaluator built yet for category: ${categoryName}`);
          evaluationData = {
            message: `QA rules for category '${categoryName}' are pending development.`,
            status: 'Skipped'
          };
          pipelineStatus = 'Discovery_Only';
      }

      // --------------------------------------------------------
      // STAGE 3: Deterministic Backend Scoring & Normalization
      // --------------------------------------------------------
      // Extract the core report. (EvaluationService flattens it, but this acts as a failsafe)
      const finalQaReport = evaluationData?.qaReport || evaluationData;

      // Default safe state for performance score
      let performanceScore = { finalScore: 0, grade: "N/A", breakdown: {} };
      
      if (pipelineStatus === 'Complete' && finalQaReport && finalQaReport.status !== 'Skipped') {
          
          // Safely inject the category into the report so the scoring service logic can track it
          if (typeof finalQaReport === 'object') {
              finalQaReport.category = categoryName; 
          }
          
          // FORCE DETERMINISTIC SCORING (Wrapped in an Error Boundary)
          // This entirely removes the LLM's ability to guess the grade and protects the API from crashing.
          try {
              performanceScore = scoringService.calculateScore(finalQaReport);
          } catch (scoringError) {
              logger.error('Deterministic Scoring Failed, falling back to safe default', { error: scoringError.message });
              performanceScore = { 
                  finalScore: 0, 
                  grade: "Scoring Error", 
                  breakdown: { details: "Backend failed to calculate score from QA data." } 
              };
          }

      } else if (pipelineStatus === 'Discovery_Only') {
          // Fallback if no QA was performed for this category
          performanceScore = { 
              finalScore: 0, 
              grade: "N/A", 
              breakdown: { details: "No QA rules configured for this category yet." } 
          };
      }

      const latency = Date.now() - startTime;
      logger.info('Pipeline Completed Successfully', { 
          latencyMs: latency, 
          category: categoryName, 
          finalScore: performanceScore.finalScore 
      });

      // --------------------------------------------------------
      // STAGE 4: Merge & Return Unified API Report
      // --------------------------------------------------------
      return {
        pipelineStatus,
        processingTimeMs: latency,
        discovery: discoveryData,
        qaReport: finalQaReport,
        performanceScore // <-- Strictly controlled by your Node.js math, absolutely no AI involvement here
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error('Orchestrator Pipeline Failed', { latencyMs: latency, error: error.message });
      
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to execute the full AI pipeline.', 'PIPELINE_ERROR', [error.message]);
    }
  }
}

module.exports = new OrchestratorService();