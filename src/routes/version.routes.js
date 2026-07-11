const express = require('express');
const versionController = require('../controllers/version.controller');

const router = express.Router();

router.get('/', versionController.getVersion);

module.exports = router;