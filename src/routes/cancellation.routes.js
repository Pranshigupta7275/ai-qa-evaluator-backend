const express = require('express');
const cancellationController = require('../controllers/cancellation.controller');

const router = express.Router();

// Maps to POST /api/v1/cancellation/evaluate
router.post('/evaluate', cancellationController.evaluate);

module.exports = router;