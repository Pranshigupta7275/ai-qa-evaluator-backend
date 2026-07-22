const logger = require('../config/logger');
const ApiResponse = require('../utils/ApiResponse');

class EvaluateController {
  async evaluate(req, res, next) {
    try {
      const { petitionId } = req.params || req.body;
      
      logger.info(`[TEST MODE] Received evaluation request for Petition: ${petitionId}`);

      // 🛑 STOP: Do not call the AI Orchestrator yet.
      // We are just testing the frontend-to-backend connection (Phase 3).

      const mockResponse = {
        pipelineStatus: "Complete",
        discovery: {
           primaryCategory: "Cancellation",
           intent: "User wants to cancel booking"
        },
        qaScore: {
           score: 85,
           grade: "Good",
           passedRules: 8,
           failedRules: 2
        }
      };

      // Send the mock data back to Next.js
      return res.status(200).json(
        new ApiResponse(200, mockResponse, "MOCK Evaluation completed successfully.")
      );

    } catch (error) {
      logger.error("Mock Evaluation Error:", error);
      next(error); 
    }
  }
}

module.exports = new EvaluateController();