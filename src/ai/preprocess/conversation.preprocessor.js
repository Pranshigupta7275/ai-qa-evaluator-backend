class ConversationPreprocessor {
  /**
   * Cleans and normalizes conversation arrays
   * @param {Array<{speaker: string, message: string}>} conversation 
   * @returns {string} Formatted conversation string
   */
  static process(conversation) {
    if (!Array.isArray(conversation)) return '';

    return conversation
      .filter(turn => turn && turn.speaker && turn.message) // Remove empty turns
      .map(turn => {
        const speaker = turn.speaker.trim();
        // Normalize line breaks and remove excessive whitespace
        const message = turn.message.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
        return `[${speaker}]: ${message}`;
      })
      .join('\n');
  }
}

module.exports = ConversationPreprocessor;