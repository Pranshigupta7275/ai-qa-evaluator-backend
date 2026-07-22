const crmService = require('./crm.service');
const evaluationOrchestrator = require('../orchestrators/evaluation.orchestrator');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

class EvaluationService {
  /**
   * Master pipeline to process a full QA evaluation
   * @param {string} petitionId 
   */
  async processEvaluation(petitionId) {
    logger.info(`[EvaluationService] Initiating pipeline for Petition: ${petitionId}`);

    // ==========================================
    // 1. FETCH EXTERNAL DATA (CRM)
    // ==========================================
    logger.info(`[EvaluationService] Fetching conversation data from CRM...`);
    const chatData = await crmService.fetchChat(petitionId);

    if (!chatData || !chatData.messages || chatData.messages.length === 0) {
      throw new ApiError(404, 'No conversation data found in CRM for this petition.', 'NOT_FOUND');
    }

    // ==========================================
    // 2. RUN AI ORCHESTRATOR
    // ==========================================
    logger.info(`[EvaluationService] Passing conversation to AI Orchestrator...`);
    
    // The orchestrator handles Intent Detection -> Policy Detection -> Prompt Gen -> LLM call
    const evaluationResult = await evaluationOrchestrator.analyzeFull(chatData);

    if (!evaluationResult) {
      throw new ApiError(500, 'AI Orchestrator failed to return an evaluation.', 'INTERNAL_SERVER_ERROR');
    }

    // ==========================================
    // 3. PERSIST TO DATABASE (REPOSITORY LAYER)
    // ==========================================
    // logger.info(`[EvaluationService] Saving evaluation to database...`);
    // await evaluationRepository.save(evaluationResult);

    logger.info(`[EvaluationService] Pipeline completed for Petition: ${petitionId}`);
    return evaluationResult;
  }
}

module.exports = new EvaluationService();