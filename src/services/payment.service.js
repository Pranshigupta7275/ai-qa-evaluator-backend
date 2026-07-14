const { GLOBAL_QA_BASE_PROMPT } = require('../ai/prompts/base.prompt');
const { PAYMENT_VERIFICATION_SOP } = require('../ai/prompts/paymentVerification.prompt');
const ProviderFactory = require('../ai/providers/provider.factory');
const logger = require('../config/logger');

class PaymentService {
  async evaluate(conversation) {
    try {
      logger.info('Compiling Payment Verification Prompt...');

      // 1. Combine Prompts
      const systemInstruction = `${GLOBAL_QA_BASE_PROMPT}\n${PAYMENT_VERIFICATION_SOP}`;
      
      const userPrompt = `
        CONVERSATION TO EVALUATE:
        ${JSON.stringify(conversation, null, 2)}
        
        REMEMBER: Output only valid, raw JSON. Do not include markdown or explanations.
      `;

      // 2. Call Provider
      const aiProvider = ProviderFactory.getProvider('groq'); 
      const llmResponse = await aiProvider.generate(systemInstruction, userPrompt); 

      // 3. Extract and Sanitize the Response
      let rawText = llmResponse?.rawText || llmResponse;
      
      if (typeof rawText === 'string') {
        // PRO-TIP: Strip markdown and any text outside the JSON braces
        const cleanedJson = rawText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        
        // Find the first '{' and last '}' to handle accidental LLM chatter
        const startIndex = cleanedJson.indexOf('{');
        const endIndex = cleanedJson.lastIndexOf('}');
        const jsonString = cleanedJson.substring(startIndex, endIndex + 1);

        const qaAnalysis = JSON.parse(jsonString);

        // 4. Log usage metrics
        if (llmResponse?.tokenUsage) {
          logger.info("LLM Usage Tracked", {
            model: llmResponse.modelName,
            totalTokens: llmResponse.tokenUsage.total_tokens
          });
        }

        return qaAnalysis;
      }

      return rawText;

    } catch (error) {
      logger.error('PaymentService Evaluation Failed:', error.message);
      // Re-throw so the Orchestrator knows the evaluation failed
      throw new Error(`AI Evaluation Failed: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();