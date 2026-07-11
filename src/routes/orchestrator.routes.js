const express = require('express');
const router = express.Router();
const OrchestratorController = require('../controllers/orchestrator.controller');

// POST /api/v1/orchestrator/analyzeFull
router.post('/analyzeFull', OrchestratorController.analyzeFull);

module.exports = router;