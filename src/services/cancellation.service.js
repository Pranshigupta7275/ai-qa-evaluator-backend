const ConversationPreprocessor = require('../ai/preprocess/conversation.preprocessor');
const ProviderFactory = require('../ai/providers/provider.factory');
const ResponseParser = require('../ai/parser/response.parser');
const ruleEngine = require('../rules/rule.engine');
const logger = require('../config/logger');
const { CANCELLATION_QA_PROMPT } = require('../ai/prompts/cancellation.prompt');
const ApiError = require('../utils/ApiError');

class CancellationService {
  async evaluate(conversation, category = 'Cancellation') {
    if (!Array.isArray(conversation) || conversation.length === 0) {
      throw new ApiError(400, 'A valid conversation array is required.', 'BAD_REQUEST');
    }

    const providerName = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    const startTime = Date.now();

    try {
      // 1. Format the conversation using your V1 preprocessor
      const transcript = ConversationPreprocessor.process(conversation);
      
      // 2. Fetch ONLY Cancellation & General Rules from the Corendon Rulebook
      const sopRules = ruleEngine.getRulesForCategory(category);

      // 3. Inject rules and transcript into the Hybrid Prompt
      const prompt = CANCELLATION_QA_PROMPT
        .replace('{sop_rules}', sopRules)
        .replace('{transcript}', transcript);

      // 4. Execute LLM using your Provider Factory
      const provider = ProviderFactory.getProvider(providerName);
      const llmResponse = await provider.generate(prompt);
      
      // 5. Parse Output securely
      const parsedEvaluation = ResponseParser.parse(llmResponse.rawText);

      // Ensure the category is explicitly set in the response
      parsedEvaluation.category = category;

      const latency = Date.now() - startTime;
      logger.info('Cancellation QA Evaluation Completed', { 
        provider: providerName, 
        latencyMs: latency,
        ruleCount: sopRules.split('\n').length 
      });

      return parsedEvaluation;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error('Cancellation QA Evaluation Failed', { 
        provider: providerName, 
        latencyMs: latency, 
        error: error.message 
      });
      
      if (error instanceof ApiError) throw error;
      throw new ApiError(502, 'Failed to generate Cancellation QA.', 'EVALUATION_ERROR', [error.message]);
    }
  }
}

module.exports = new CancellationService();