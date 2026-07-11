const intentService = require('./intent.service');
const cancellationService = require('./cancellation.service');
const refundService = require('./refund.service'); 
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

class OrchestratorService {
  async runFullPipeline(conversation) {
    if (!Array.isArray(conversation) || conversation.length === 0) {
      throw new ApiError(400, 'A valid conversation array is required.', 'BAD_REQUEST');
    }

    const startTime = Date.now();
    logger.info('Starting Senior QA Coaching Pipeline for Corendon Airlines...');

    try {
      // --------------------------------------------------------
      // STAGE 1: Discovery (Intent & Category)
      // --------------------------------------------------------
      const discoveryData = await intentService.detectIntentAndCategory(conversation);
      
      // Extract the detected category safely. 
      const categoryName = discoveryData.category?.name || discoveryData.primaryCategory || 'Unknown';
      
      let evaluationData = null;
      let pipelineStatus = 'Complete';

      // --------------------------------------------------------
      // STAGE 2: Dynamic QA Routing (Root Cause Analysis)
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
          logger.info(`No specific coaching rules built yet for category: ${categoryName}`);
          evaluationData = {
            message: `QA Coaching rules for category '${categoryName}' are pending development.`,
            status: 'Skipped'
          };
          pipelineStatus = 'Discovery_Only';
      }

      // --------------------------------------------------------
      // STAGE 3: Data Normalization
      // --------------------------------------------------------
      // Extract the flat report. (EvaluationService flattens it, but this acts as a failsafe)
      const finalCoachingReport = evaluationData?.qaReport || evaluationData;
      
      if (pipelineStatus === 'Complete' && finalCoachingReport && finalCoachingReport.status !== 'Skipped') {
          // Safely inject the category into the report for the frontend dashboard
          if (typeof finalCoachingReport === 'object') {
              finalCoachingReport.category = categoryName; 
          }
      }

      const latency = Date.now() - startTime;
      logger.info('Pipeline Completed Successfully', { 
          latencyMs: latency, 
          category: categoryName,
          status: pipelineStatus
      });

      // --------------------------------------------------------
      // STAGE 4: Merge & Return Unified API Report (No Scoring)
      // --------------------------------------------------------
    return {
        pipelineStatus,
        processingTimeMs: latency,
        discovery: discoveryData,
        qaReport: finalCoachingReport 
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