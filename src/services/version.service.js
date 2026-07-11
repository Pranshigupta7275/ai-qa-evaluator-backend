class VersionService {
  async getVersionInfo() {
    return {
      name: 'AI Quality Observer',
      version: '1.0.0'
    };
  }
}

module.exports = new VersionService();