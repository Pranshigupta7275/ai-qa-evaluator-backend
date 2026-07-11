const express = require('express');
const orchestratorController = require('../controllers/orchestrator.controller');

const router = express.Router();

// Maps to POST /api/v1/qa/analyze
router.post('/analyze', orchestratorController.analyzeFull);

module.exports = router;