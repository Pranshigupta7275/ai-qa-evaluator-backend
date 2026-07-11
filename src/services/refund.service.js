const GroqProvider = require('../ai/providers/groq.provider');
const promptImport = require('../ai/prompts/refund.prompt');
const ConversationPreprocessor = require('../ai/preprocess/conversation.preprocessor');
const ruleEngine = require('../rules/rule.engine');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

// Safely handle both "module.exports = string" and "module.exports = { string }"
const REFUND_EVALUATION_PROMPT = promptImport.REFUND_EVALUATION_PROMPT || promptImport;

class RefundService {
  constructor() {
    this.provider = new GroqProvider();
  }

  async evaluateRefund(conversation) {
    const startTime = Date.now();

    if (!Array.isArray(conversation) || conversation.length === 0) {
      throw new ApiError(400, 'A valid conversation array is required.', 'BAD_REQUEST');
    }

    // 1. Process transcript 
    const transcript = ConversationPreprocessor.process(conversation);
    
    // 2. Fetch Category SOP Rules 
    const sopRules = ruleEngine.getRulesForCategory('Refund');

    // SAFEGUARD 1: Ensure Prompt Exists before replacing
    if (!REFUND_EVALUATION_PROMPT || typeof REFUND_EVALUATION_PROMPT !== 'string') {
        throw new ApiError(500, 'Refund prompt failed to load. Check refund.prompt.js exports.');
    }

    // 3. Construct prompt 
    const prompt = REFUND_EVALUATION_PROMPT
      .replace('{transcript}', transcript)
      .replace('{sop_rules}', sopRules);

    try {
      // 4. Execute LLM call
      const llmResponse = await this.provider.generate(prompt);
      
      // SAFEGUARD 2: Handle whether Groq returns a string or an object
      const aiText = typeof llmResponse === 'string' 
        ? llmResponse 
        : (llmResponse?.rawText || llmResponse?.text || '');

      if (!aiText) {
          throw new Error('LLM returned an empty response.');
      }

      // 5. Clean and parse the response
      const cleanJsonStr = aiText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
        
      const parsedEvaluation = JSON.parse(cleanJsonStr);
      parsedEvaluation.category = 'Refund'; 

      // 6. Log success for metrics
      logger.info('Refund QA Evaluation Completed', { 
        latencyMs: Date.now() - startTime 
      });

      return parsedEvaluation;

    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error('Refund Evaluation Pipeline Failed', { latencyMs: latency, error: error.message });

      if (error instanceof SyntaxError) {
        throw new ApiError(502, 'Failed to parse the LLM evaluation into structured JSON.', 'PARSE_ERROR', [error.message]);
      }
      throw new ApiError(502, 'Failed to generate refund evaluation from Groq API.', 'PROVIDER_ERROR', [error.message]);
    }
  }
}

module.exports = new RefundService();