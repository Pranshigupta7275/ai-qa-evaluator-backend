const crmService = require('../services/crmService');

const getEmployees = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    const data = await crmService.getEmployees(authToken);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message
    });
  }
};

const getCenters = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    const data = await crmService.getCenters(authToken);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message
    });
  }
};

// 🔴 This was missing from your file!
const getObservations = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    const queryParams = req.query; 
    const data = await crmService.getObservations(authToken, queryParams);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message
    });
  }
};

const getBatchEvaluateStatus = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    const payload = req.body; 
    const data = await crmService.getBatchEvaluateStatus(authToken, payload);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getEmployees,
  getCenters,
  getObservations, 
  getBatchEvaluateStatus
};