const express = require('express');
const router = express.Router();

const queryController = require('../controllers/query.controller');

router.get('/', queryController.getQueries);

router.get('/:petitionId', queryController.getQueryDetails);

module.exports = router;