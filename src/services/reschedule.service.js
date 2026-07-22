const { RESCHEDULE_SOP } = require('../ai/prompts/reschedule.prompt');
const ProviderFactory = require('../ai/providers/provider.factory');
const logger = require('../config/logger');

class RescheduleService {
  
  formatConversation(data) {
    // DEFENSIVE UNWRAPPING: Hunts down the array whether passed directly or wrapped in an object
    const chatArray = Array.isArray(data) ? data : data?.conversation;
    
    if (!chatArray || !Array.isArray(chatArray) || chatArray.length === 0) {
        logger.warn("🚨 CRITICAL: formatConversation received empty data! Check Orchestrator routing.");
        return "[ERROR: NO TRANSCRIPT PROVIDED TO LLM]";
    }
    
    return chatArray.map(turn => {
        const time = turn.timestamp || 'Time N/A';
        const speaker = turn.speaker || turn.role || 'Unknown';
        const message = turn.message || '';
        return `[${time}] ${speaker}: ${message}`;
    }).join('\n');
  }

  async evaluate(requestData) {
    try {
      logger.info('Executing AI evaluation for Reschedule/Name Change SOP...');

      const systemInstruction = RESCHEDULE_SOP;
      const formattedChat = this.formatConversation(requestData);
      
      // Using XML tags (<TRANSCRIPT>) provides extreme clarity to strict models like Llama 3/Groq
      const userPrompt = `
Here is the customer service transcript you must evaluate:

<TRANSCRIPT>
${formattedChat}
</TRANSCRIPT>

REMEMBER: You must extract quotes VERBATIM from the <TRANSCRIPT> above. 
Output ONLY valid, raw JSON. Do NOT include markdown blocks or conversational text.
      `;

      // QA DEBUGGING: This prints exactly what is being sent to the AI in your server terminal
      console.log("\n--- DEBUG: PAYLOAD SENT TO LLM ---");
      console.log(userPrompt);
      console.log("----------------------------------\n");

      const aiProvider = ProviderFactory.getProvider('groq'); 
      const llmResponse = await aiProvider.generate(systemInstruction, userPrompt); 

      let rawText = llmResponse?.rawText || llmResponse;
      
      if (typeof rawText === 'string') {
        const cleanedText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const startIndex = cleanedText.indexOf('{');
        const endIndex = cleanedText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("Failed to locate valid JSON brackets in AI response.");
        }

        const jsonString = cleanedText.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonString);
      }

      return rawText;

    } catch (error) {
      logger.error('RescheduleService Evaluation Failed:', error.message);
      throw new Error(`AI Evaluation Engine Failed for Reschedule SOP`);
    }
  }
}

module.exports = new RescheduleService();