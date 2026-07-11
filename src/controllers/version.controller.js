const versionService = require('../services/version.service');
const ApiResponse = require('../utils/ApiResponse');

class VersionController {
  async getVersion(req, res) {
    const versionData = await versionService.getVersionInfo();
    return new ApiResponse(200, 'Version Information', versionData).send(res);
  }
}

module.exports = new VersionController();