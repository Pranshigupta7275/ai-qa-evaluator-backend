class ResponseParser {
  static parse(rawText) {
    try {
      // 1. Strip markdown code blocks if the AI ignored instructions
      let cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // 2. Find the first { and last } in case the AI added a preamble like "Here is your JSON:"
      const startIndex = cleanedText.indexOf('{');
      const endIndex = cleanedText.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1) {
        cleanedText = cleanedText.substring(startIndex, endIndex + 1);
      }

      // 3. Parse safely
      return JSON.parse(cleanedText);
    } catch (error) {
      throw new Error('AI responded with malformed or invalid data structure');
    }
  }
}

module.exports = ResponseParser;