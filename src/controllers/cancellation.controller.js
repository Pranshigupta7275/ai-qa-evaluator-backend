const cancellationService = require('../services/cancellation.service');

class CancellationController {
  async evaluate(req, res, next) {
    try {
      const { conversation } = req.body;
      
      const evaluationData = await cancellationService.evaluateCancellation(conversation);
      
      // If the service caught an empty array and returned the specific error object
      if (evaluationData.error) {
        return res.status(400).json({
          success: false,
          message: evaluationData.error,
          data: null,
          error: { code: 'BAD_REQUEST' }
        });
      }

      // Return standard API response
      return res.status(200).json({
        success: true,
        message: 'Cancellation conversation evaluated successfully',
        data: evaluationData,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CancellationController();