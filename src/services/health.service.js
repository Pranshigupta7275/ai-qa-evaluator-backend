const env = require('../config/env');

class HealthService {
  async getHealthStatus() {
    return {
      status: 'OK',
      uptime: `${process.uptime().toFixed(2)}s`,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new HealthService();