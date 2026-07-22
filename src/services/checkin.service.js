const { CHECKIN_SOP } = require('../ai/prompts/checkin.prompt');
const ProviderFactory = require('../ai/providers/provider.factory');
const logger = require('../config/logger');

class CheckinService {
  
  formatConversation(conversation) {
    if (!Array.isArray(conversation)) return "";
    
    return conversation.map(turn => {
        const time = turn.timestamp || 'Unknown Time';
        const speaker = turn.speaker || turn.role || 'Unknown';
        const message = turn.message || '';
        return `[${time}] ${speaker}: ${message}`;
    }).join('\n');
  }

  async evaluate(conversation) {
    try {
      logger.info('Executing AI evaluation for Check-in SOP...');
      
      const formattedChat = this.formatConversation(conversation);
      
      // We put the transcript FIRST so the AI doesn't ignore it
      const userPrompt = `
=== START OF TRANSCRIPT ===
${formattedChat}
=== END OF TRANSCRIPT ===

${CHECKIN_SOP}
      `;

      // Call the AI Provider
      const aiProvider = ProviderFactory.getProvider('groq'); 
      const llmResponse = await aiProvider.generate('', userPrompt); 

      // Bulletproof JSON Extraction
      let rawText = llmResponse?.rawText || llmResponse;
      
      if (typeof rawText === 'string') {
        const cleanedText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        
        const startIndex = cleanedText.indexOf('{');
        const endIndex = cleanedText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            logger.error(`AI generated invalid response format. Raw Output: ${rawText}`);
            throw new Error("Failed to locate valid JSON brackets in the AI response.");
        }

        const jsonString = cleanedText.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonString);
      }

      return rawText;

    } catch (error) {
      logger.error('CheckinService Evaluation Failed:', error.message);
      throw new Error(`AI Evaluation Engine Failed for Check-in SOP`);
    }
  }
}

module.exports = new CheckinService();