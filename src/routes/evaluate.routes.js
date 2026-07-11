const express = require('express');
const evaluateController = require('../controllers/evaluate.controller');

const router = express.Router();


router.post('/', evaluateController.evaluate);

module.exports = router;