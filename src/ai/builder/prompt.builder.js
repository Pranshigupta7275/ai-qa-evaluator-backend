const { BASE_EVALUATION_PROMPT } = require('../prompts/base.prompt');

class PromptBuilder {
  /**
   * Injects the preprocessed transcript into the prompt template
   * @param {string} formattedTranscript 
   * @returns {string} Fully constructed prompt
   */
  static buildEvaluationPrompt(formattedTranscript) {
    return BASE_EVALUATION_PROMPT.replace('{transcript}', formattedTranscript);
  }
}

module.exports = PromptBuilder;