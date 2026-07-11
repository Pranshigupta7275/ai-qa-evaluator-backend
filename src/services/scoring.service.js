class ScoringService {
  calculateScore(qaReport) {
    if (!qaReport || typeof qaReport !== 'object') {
      return { finalScore: 0, grade: "N/A", breakdown: {} };
    }

    const category = qaReport.category || 'Unknown';
    
    // Safely extract and normalize the CRM error string
    let crmError = 'NONE';
    if (typeof qaReport.crmErrorType === 'string') {
      crmError = qaReport.crmErrorType.trim().toUpperCase();
    }

    // 1. Data-Type Safeguard: Ensure hardQA is an array before filtering
    // This prevents a server crash if the LLM hallucinates a string or object instead of an array.
    const hardQAArray = Array.isArray(qaReport.hardQA) ? qaReport.hardQA : [];
    
    // Calculate the exact number of Hard QA failures safely
    const hardQAFails = hardQAArray.filter(
      rule => rule && rule.status && typeof rule.status === 'string' && rule.status.toUpperCase() === 'FAIL'
    ).length;

    let finalScore = 100;
    let grade = "A (Excellent)";

    // 2. Define strict severity tiers based on CRM UI values
    // Note: 'GRAMETICAL' is included to strictly match your CRM dropdown spelling
    const criticalErrors = [
      'CRITICAL', 
      'MISLEADING', 
      'WRONG IDENTIFICATION'
    ];
    
    const majorErrors = [
      'INCOMPLETE RESOLUTION', 
      'INCORRECT INFORMATION', 
      'ESCALATION DELAY'
    ];
    
    const minorErrors = [
      'GREETING ERROR', 
      'CLOSING ERROR', 
      'GRAMETICAL', 
      'GRAMMATICAL', // Added correct spelling fallback just in case the LLM autocorrects
      'ALIAS VIOLATION', 
      'AHT (AVERAGE HANDLE TIME)', 
      'ART (AGENT RESPONSE TIME)'
    ];

    // 3. Apply Deterministic Scoring Rubric
    if (criticalErrors.includes(crmError)) {
      finalScore = 0;
      grade = `F (Action Required - ${crmError})`;
    } else if (majorErrors.includes(crmError) || hardQAFails >= 3) {
      finalScore = 60;
      grade = "C (Needs Improvement)";
    } else if (minorErrors.includes(crmError) || hardQAFails > 0) {
      finalScore = 80;
      grade = "B (Good - Minor Issues)";
    } else if (crmError !== 'NONE') {
      // Fallback safeguard in case an unknown error type is passed by the AI
      finalScore = 80;
      grade = "B (Good - Uncategorized Issue)";
    }

    // 4. Construct descriptive breakdown text for the frontend dashboard
    let detailsText = "No SOP violations detected.";
    if (criticalErrors.includes(crmError)) {
      detailsText = `Critical failure: ${crmError} detected. Immediate review required.`;
    } else if (crmError !== 'NONE' && hardQAFails > 0) {
      detailsText = `Score impacted by ${hardQAFails} Hard QA failure(s) and CRM Error: ${crmError}.`;
    } else if (crmError !== 'NONE') {
      detailsText = `Score impacted by CRM Error: ${crmError}.`;
    } else if (hardQAFails > 0) {
      detailsText = `Score impacted by ${hardQAFails} Hard QA failure(s).`;
    }

    // 5. Return the finalized, backend-controlled scoring block
    return {
      finalScore,
      grade,
      breakdown: {
        category,
        errorFlagged: crmError,
        details: detailsText
      }
    };
  }
}

module.exports = new ScoringService();