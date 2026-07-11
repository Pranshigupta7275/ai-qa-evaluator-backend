const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../config/logger');
const ApiError = require('../../utils/ApiError');

class GeminiProvider {
  constructor() {
    // 1. Revert to securely using the environment variable
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    // 2. Update to a supported, active model
    this.modelName = 'gemini-2.0-flash';
  }

  async generate(prompt) {
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      
      return {
        rawText: response.text(),
        tokenUsage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        },
        modelName: this.modelName
      };
    } catch (error) {
      logger.error('Gemini Provider Error:', error);
      throw new ApiError(502, 'Failed to generate response from Gemini API', 'PROVIDER_ERROR', [error.message]);
    }
  }
}

module.exports = GeminiProvider;