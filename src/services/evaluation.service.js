const ConversationPreprocessor = require('../ai/preprocess/conversation.preprocessor');
const PromptBuilder = require('../ai/builder/prompt.builder');
const ProviderFactory = require('../ai/providers/provider.factory');
const ResponseParser = require('../ai/parser/response.parser');
const logger = require('../config/logger');

class EvaluationService {
  async evaluateConversation(conversation) {
    const startTime = Date.now();
    const providerName = process.env.DEFAULT_AI_PROVIDER || 'gemini';
    
    try {
      // 1. Preprocess the conversation
      const transcript = ConversationPreprocessor.process(conversation);
      
      // 2. Build the Evaluation Prompt
      const prompt = PromptBuilder.buildEvaluationPrompt(transcript);
      
      // 3. Get LLM Provider & Execute
      const provider = ProviderFactory.getProvider(providerName);
      const llmResponse = await provider.generate(prompt);
      
      // 4. Parse the LLM Output
      let parsedData = ResponseParser.parse(llmResponse.rawText);

      // ==========================================
      // ANTI-HALLUCINATION & SCHEMA GUARDRAILS
      // ==========================================
      
      // Guardrail 1: Robust Nested JSON Flattening (Matryoshka Fix)
      // LLMs occasionally wrap the response in multiple "qaReport" keys despite instructions.
      // This drills down to the core payload, no matter how deeply it was nested.
      while (parsedData && parsedData.qaReport && typeof parsedData.qaReport === 'object' && parsedData.qaReport.qaReport) {
        parsedData.qaReport = parsedData.qaReport.qaReport;
      }

      // Normalize the payload: Extract the flat core object
      let normalizedReport = parsedData.qaReport ? parsedData.qaReport : parsedData;

      // Guardrail 2: Strip ALL Rogue Scoring & Grading
      // The deterministic Node.js backend calculates these. Delete them immediately if the LLM hallucinates them.
      if (normalizedReport) {
        delete normalizedReport.performanceScore;
        delete normalizedReport.overallScore;
        delete normalizedReport.grade;
        
        // Failsafe: Also delete from the root object if they leaked outside the wrapper
        if (parsedData !== normalizedReport) {
          delete parsedData.performanceScore;
          delete parsedData.overallScore;
          delete parsedData.grade;
        }
      }

      // 5. Logging latency & metrics
      const latency = Date.now() - startTime;
      logger.info('Conversation Evaluated Successfully', {
        provider: providerName,
        model: llmResponse.modelName || 'default',
        latencyMs: latency,
        tokens: llmResponse.tokenUsage || {}
      });

      // 6. Return the perfectly sanitized, flat data to the Orchestrator
      return normalizedReport;

    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error('Evaluation Pipeline Failed', {
        provider: providerName,
        latencyMs: latency,
        error: error.message
      });
      throw error; 
    }
  }
}

module.exports = new EvaluationService();