const Groq = require('groq-sdk');
const logger = require('../../config/logger');
const ApiError = require('../../utils/ApiError');

class GroqProvider {
  constructor() {
    // 1. Ensure the API key is being read properly
    const apiKey = process.env.GROQ_API_KEY || '';
    
    if (!apiKey) {
      logger.warn('GROQ_API_KEY is completely missing or empty in the environment!');
    }

    this.client = new Groq({ apiKey: apiKey });
    
    // 2. Updated to Groq's most reliable and lightning-fast JSON model
    this.modelName = 'llama-3.3-70b-versatile'; 
  }

  async generate(prompt) {
    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.modelName,
        response_format: { type: 'json_object' }
      });

      return {
        rawText: completion.choices[0]?.message?.content || '{}',
        tokenUsage: completion.usage || {},
        modelName: this.modelName
      };
    } catch (error) {
      logger.error('Groq Provider Error:', error);
      
      // 3. THIS IS THE FIX: Pass the exact Groq error message so Postman can show it
      throw new ApiError(
        502, 
        'Failed to generate response from Groq API', 
        'PROVIDER_ERROR', 
        [error.message || 'Unknown Groq Error']
      );
    }
  }
}

module.exports = GroqProvider;