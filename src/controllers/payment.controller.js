const PaymentService = require('../services/payment.service');
const logger = require('../config/logger');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class PaymentController {
  async evaluate(req, res, next) {
    const startTime = Date.now();
    
    try {
      const conversation = req.body?.conversation;

      // ==========================================
      // INPUT VALIDATION
      // ==========================================
      if (!Array.isArray(conversation) || conversation.length === 0) {
        throw new ApiError(
          400, 
          'A valid conversation array is required.', 
          'BAD_REQUEST'
        );
      }

      logger.info('Starting standalone Payment Verification QA Evaluation...');

      // ==========================================
      // RUN LLM EVALUATION
      // ==========================================
      const qaAnalysis = await PaymentService.evaluate(conversation);

      // ==========================================
      // RETURN SUCCESS RESPONSE
      // ==========================================
      return res.status(200).json(
        new ApiResponse(
          200, 
          {
            pipelineStatus: "Complete",
            processingTimeMs: Date.now() - startTime,
            qaAnalysis,
            category: "Payment Verification"
          }, 
          'Payment Verification evaluation completed successfully.'
        )
      );

    } catch (error) {
      logger.error('PaymentController Error:', error);
      next(error);
    }
  }
}

module.exports = new PaymentController();