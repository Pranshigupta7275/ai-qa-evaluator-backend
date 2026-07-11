const { GLOBAL_QA_BASE_PROMPT } = require('../ai/prompts/base.prompt');
const { PAYMENT_VERIFICATION_SOP } = require('../ai/prompts/paymentVerification.prompt');
const ProviderFactory = require('../ai/providers/provider.factory');
const logger = require('../config/logger');

class PaymentService {
  async evaluate(conversation) {
    const conversationText = conversation.map(c => `${c.role}: ${c.message}`).join('\n');
    try {
      logger.info('Compiling Payment Verification Prompt...');

      // 1. Combine the Base Rules with the Specific SOP
      const systemInstruction = `
        ${GLOBAL_QA_BASE_PROMPT}
        
        ${PAYMENT_VERIFICATION_SOP}
      `;

      // 2. Format the conversation for the LLM
      const formattedConversation = JSON.stringify(conversation, null, 2);
      
      const userPrompt = `
        CONVERSATION TO EVALUATE:
        ${formattedConversation}
      `;

      // 3. Call your LLM Provider Factory
      const aiProvider = ProviderFactory.getProvider('groq'); 
      const llmResponse = await aiProvider.generate(systemInstruction, userPrompt); 

      // 4. Parse and return the JSON cleanly
      let qaAnalysis = {};
      
      // If the response has rawText, let's parse it into a real object
      if (llmResponse && llmResponse.rawText) {
        try {
            // Unpack the JSON so it sits at the root of qaAnalysis
            qaAnalysis = JSON.parse(llmResponse.rawText);
            
            
            logger.info("LLM Usage Tracked", {
                model: llmResponse.modelName,
                promptTokens: llmResponse.tokenUsage?.prompt_tokens,
                completionTokens: llmResponse.tokenUsage?.completion_tokens,
                totalTokens: llmResponse.tokenUsage?.total_tokens
            });

        } catch (parseError) {
            logger.warn('Could not parse AI response as JSON. Returning raw text.');
            qaAnalysis = { rawText: llmResponse.rawText };
        }
      } else if (typeof llmResponse === 'string') {
          try {
              qaAnalysis = JSON.parse(llmResponse);
          } catch (e) {
              logger.warn('Could not parse string response as JSON.');
              qaAnalysis = { rawText: llmResponse };
          }
      } else {
          qaAnalysis = llmResponse;
      }
      
      return qaAnalysis;

    } catch (error) {
      logger.error('PaymentService Evaluation Failed:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();