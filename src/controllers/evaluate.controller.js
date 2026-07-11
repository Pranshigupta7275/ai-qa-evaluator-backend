const intentDetectionService = require('../services/intent.service');
const { GLOBAL_QA_BASE_PROMPT } = require('../ai/prompts/base.prompt.js');
const logger = require('../config/logger');

class EvaluateController {
  // The route is looking for exactly this word: "evaluate"
  async evaluate(req, res, next) {
    try {
      const { conversation } = req.body;
      
      logger.info('Starting Intent and Category Detection Pipeline...');

      const detectionData = await intentDetectionService.detectIntentAndCategory(conversation);
      
      return res.status(200).json({
        success: true,
        message: 'Conversation intent and category detected successfully',
        data: detectionData,
        error: null
      });

    } catch (error) {
      next(error); 
    }
  }
}

// Ensure you have the "new" keyword here!
module.exports = new EvaluateController();