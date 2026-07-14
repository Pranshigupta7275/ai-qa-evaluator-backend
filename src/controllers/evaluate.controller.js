const intentDetectionService = require('../services/intent.service');
const logger = require('../config/logger');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class EvaluateController {
  // The route is looking for exactly this word: "evaluate"
  async evaluate(req, res, next) {
    try {
      const { conversation } = req.body;

      // ==========================================
      // INPUT VALIDATION
      // ==========================================
      if (!conversation || !Array.isArray(conversation)) {
        throw new ApiError(400, 'A valid conversation array is required.', 'BAD_REQUEST');
      }
      
      logger.info('Starting Intent and Category Detection Pipeline...');

      // Run the detection pipeline
      const detectionData = await intentDetectionService.detectIntentAndCategory(conversation);
      
      // Return using the standard ApiResponse wrapper
      return res.status(200).json(
        new ApiResponse(
          200, 
          detectionData, 
          'Conversation intent and category detected successfully.'
        )
      );

    } catch (error) {
      logger.error('Intent Detection Pipeline Error:', error);
      next(error); 
    }
  }
}

module.exports = new EvaluateController();