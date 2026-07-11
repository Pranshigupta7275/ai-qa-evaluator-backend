const express = require('express');
const refundController = require('../controllers/refund.controller');

const router = express.Router();

// Maps to POST /api/v1/refund/evaluate (assuming router is mounted at /refund)
router.post('/evaluate', refundController.evaluate);

module.exports = router;