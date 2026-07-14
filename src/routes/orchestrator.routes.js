const express = require('express');
const router = express.Router();
const OrchestratorController = require('../controllers/orchestrator.controller');

// POST /api/v1/orchestrator/analyzeFull (Used by the CRM to run evaluations)
router.post('/analyzeFull', OrchestratorController.analyzeFull);

// GET /api/v1/orchestrator/reports (Used by the Dashboard to view evaluations)
router.get('/reports', OrchestratorController.getEvaluations);

module.exports = router;