// Inside src/routes/quality.routes.js
const express = require('express');
const router = express.Router();
const qualityController = require('../controllers/quality.controller');

// These map to /api/v1/quality-monitoring/employees and /centers
router.get('/employees', qualityController.getEmployees);
router.get('/centers', qualityController.getCenters);
router.get('/observations', qualityController.getObservations);

router.post('/observations/evaluate-status/batch', qualityController.getBatchEvaluateStatus);

module.exports = router;