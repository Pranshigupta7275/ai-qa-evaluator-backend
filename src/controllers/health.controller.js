const healthService = require('../services/health.service');
const ApiResponse = require('../utils/ApiResponse');

class HealthController {
  async checkHealth(req, res) {
    const healthData = await healthService.getHealthStatus();
    return new ApiResponse(200, 'System Healthy', healthData).send(res);
  }
}

module.exports = new HealthController();