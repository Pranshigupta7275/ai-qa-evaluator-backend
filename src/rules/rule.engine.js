const logger = require('../config/logger');

class RuleEngine {
  constructor() {
    this.rules = [];
    this.loadRules();
  }

  loadRules() {
    try {
      // 1. Load the JSON file first
      const loadedRules = require('./corendon.rules.json');
      
      // 2. NOW check if what we loaded is actually an array
      if (!Array.isArray(loadedRules)) {
        logger.warn('corendon.rules.json is not an array. Resetting to empty.');
        this.rules = [];
      } else {
        this.rules = loadedRules;
        logger.info(`Successfully loaded ${this.rules.length} Corendon SOP rules into memory.`);
      }
    } catch (error) {
      logger.error('Failed to load corendon.rules.json. Ensure the file exists in the src/rules directory.', { error: error.message });
      // Fallback to empty array to prevent CRM crashes if file is missing
      this.rules = []; 
    }
  }

  /**
   * Filters rules to save LLM tokens and ensure CRM accuracy. 
   * Always includes "General" rules, plus the rules matching the CRM-detected category.
   */
  getRulesForCategory(categoryName) {
    if (!this.rules || this.rules.length === 0) {
       return "No specific SOP rules available.";
    }

    // Normalize strings so "Cancellation" matches "cancellation" perfectly
    const normalizedCategory = (categoryName || '').trim().toLowerCase();

    // 3. THE FIX: Use Optional Chaining (?.) to prevent undefined crashes
    const relevantRules = this.rules.filter(
      rule => 
        rule.category?.toLowerCase() === 'general' || 
        rule.category?.toLowerCase() === normalizedCategory
    );

    if (relevantRules.length === 0) {
      return "No specific Corendon SOP rules apply to this category.";
    }

    // Format them cleanly for the AI Prompt
    return relevantRules.map(rule => `[${rule.ruleId}]: ${rule.description}`).join('\n');
  }
}

module.exports = new RuleEngine();