const express = require('express');

const healthRoutes = require('./health.routes');
const versionRoutes = require('./version.routes');
const evaluateRoutes = require('./evaluate.routes');
const refundRoutes = require('./refund.routes');
const cancellationRoutes = require('./cancellation.routes');
const qaRoutes = require('./qa.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/version', versionRoutes);
router.use('/evaluate', evaluateRoutes);
router.use('/refund', refundRoutes);
router.use('/cancellation', cancellationRoutes);
router.use('/qa', qaRoutes);

module.exports = router;