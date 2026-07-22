const express = require('express');

const healthRoutes = require('./health.routes');
const versionRoutes = require('./version.routes');
const evaluateRoutes = require('./evaluate.routes');
const refundRoutes = require('./refund.routes');
const cancellationRoutes = require('./cancellation.routes');
const paymentRoutes = require('./payment.routes');
const qaRoutes = require('./qa.routes');
const orchestratorRoutes = require('./orchestrator.routes');
const orchestratorController = require('../controllers/orchestrator.controller');



const queryRoutes = require('./query.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/version', versionRoutes);
router.use('/evaluate', evaluateRoutes);
router.use('/refund', refundRoutes);
router.use('/cancellation', cancellationRoutes);
router.use('/payment', paymentRoutes);
router.use('/orchestrator', orchestratorRoutes);
router.post('/analyzeFull', orchestratorController.analyzeFull);
router.use('/qa', qaRoutes);


router.use('/public-query', queryRoutes);

module.exports = router;