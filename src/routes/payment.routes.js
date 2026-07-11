const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');

// ==========================================
// PAYMENT VERIFICATION ROUTES
// ==========================================

// POST /api/payment/evaluate
// Standalone endpoint to evaluate only Payment Verification SOPs (bypasses Intent Router)
router.post('/evaluate', PaymentController.evaluate);

module.exports = router;