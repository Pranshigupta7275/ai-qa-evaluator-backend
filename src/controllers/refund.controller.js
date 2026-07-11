const refundService = require('../services/refund.service');

class RefundController {
  async evaluate(req, res, next) {
    try {
      const { conversation } = req.body;
      
      // Ensure the controller validates input too
      if (!conversation) throw new Error('No conversation provided');
      
      const evaluationData = await refundService.evaluateRefund(conversation);
      
      return res.status(200).json({
        success: true,
        message: 'Refund conversation evaluated successfully',
        data: evaluationData,
        error: null
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RefundController();