const { GLOBAL_QA_BASE_PROMPT } = require('../ai/prompts/base.prompt');
const { BAGGAGE_LOST_ITEMS_SOP } = require('../ai/prompts/baggageLostItems.prompt');
const ProviderFactory = require('../ai/providers/provider.factory');
const logger = require('../config/logger');

class BaggageService {
  async evaluate(conversation) {
    try {
      logger.info('Compiling Baggage & Lost Items Prompt...');

      // 1. Combine the Global Guardrails with the specific Baggage Rules
      const systemInstruction = `${GLOBAL_QA_BASE_PROMPT}\n${BAGGAGE_LOST_ITEMS_SOP}`;
      
      const userPrompt = `
        CONVERSATION TO EVALUATE:
        ${JSON.stringify(conversation, null, 2)}
        
        REMEMBER: Output only valid, raw JSON. Do not include markdown or explanations.
      `;

      // 2. Execute LLM Call
      const aiProvider = ProviderFactory.getProvider('groq'); 
      const llmResponse = await aiProvider.generate(systemInstruction, userPrompt); 

      // 3. Robust JSON Extraction
      let rawText = llmResponse?.rawText || llmResponse;
      
      if (typeof rawText === 'string') {
        const cleanedJson = rawText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        
        const startIndex = cleanedJson.indexOf('{');
        const endIndex = cleanedJson.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("Failed to locate valid JSON brackets in the AI response.");
        }

        const jsonString = cleanedJson.substring(startIndex, endIndex + 1);
        const qaAnalysis = JSON.parse(jsonString);

        if (llmResponse?.tokenUsage) {
          logger.info("LLM Usage Tracked (Baggage)", {
            model: llmResponse.modelName || 'Unknown Model',
            totalTokens: llmResponse.tokenUsage.total_tokens
          });
        }

        return qaAnalysis;
      }

      return rawText;

    } catch (error) {
      logger.error('BaggageService Evaluation Failed:', error.message);
      throw new Error(`AI Evaluation Failed: ${error.message}`);
    }
  }
}

module.exports = new BaggageService();