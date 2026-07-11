const GeminiProvider = require('./gemini.provider');
const GroqProvider = require('./groq.provider');
const ApiError = require('../../utils/ApiError');

class ProviderFactory {
  static getProvider(providerName = process.env.DEFAULT_AI_PROVIDER || 'gemini') {
    switch (providerName.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider();
      case 'groq':
        return new GroqProvider();
      default:
        throw new ApiError(500, `AI Provider '${providerName}' is not supported`, 'INVALID_PROVIDER');
    }
  }
}

module.exports = ProviderFactory;