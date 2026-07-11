const ConversationPreprocessor = require('../ai/preprocess/conversation.preprocessor');
const ProviderFactory = require('../ai/providers/provider.factory');
const ResponseParser = require('../ai/parser/response.parser');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const { INTENT_DETECTION_PROMPT } = require('../ai/prompts/base.prompt.js'); 

class IntentDetectionService {
  async detectIntentAndCategory(conversation) {
    if (!Array.isArray(conversation) || conversation.length === 0) {
      throw new ApiError(400, 'A valid conversation array is required.', 'BAD_REQUEST');
    }

    const startTime = Date.now();
    let routingSource = 'Unknown';
    let finalCategory = 'Unknown';
    let finalConfidence = 0.0;
    const providerName = process.env.DEFAULT_AI_PROVIDER || 'gemini';

    try {
      // ==========================================
      // PREPROCESSING: Extract Customer Text for Rule Engine
      // ==========================================
      const rawCustomerText = conversation
        .filter(msg => msg.role && msg.role.toLowerCase() === 'customer' || msg.speaker && msg.speaker.toLowerCase() === 'customer')
        .map(msg => msg.message)
        .join(' ')
        .toLowerCase();

      const normalizedCustomerText = rawCustomerText
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // ==========================================
      // STAGE 1: POLICY DETECTOR (Highest Priority - Information Only)
      // ==========================================
      const isLengthyInteraction = conversation.length >= 4; 
      const hasSpecificIdentifiers = ['pnr', 'booking reference'].some(keyword => normalizedCustomerText.includes(keyword));
      const isStrictlyTimelineQuery = ['how long', 'timeline', 'process time'].some(keyword => normalizedCustomerText.includes(keyword));

      // Skip policy check if they had a long chat with an agent OR provided a PNR (unless strictly asking for a timeline)
      const skipPolicyCheck = isLengthyInteraction || (hasSpecificIdentifiers && !isStrictlyTimelineQuery);

      if (!skipPolicyCheck) {
        const policyPatterns = [
          /\bhow\b.*\blong\b.*\bprocess\b/i, /\bwhat\b.*\bcancellation\b.*\bpolicy\b/i, /\bhow\b.*\bget\b.*\brefund\b/i,
          /\bcan\b.*\bcancel\b/i, /\ballowed\b.*\bcancel\b/i, /\bhow\b.*\bcancellation\b.*\bwork\b/i,
          /\bwhat\b.*\brefund\b.*\bpolicy\b/i, /\bam\b.*\beligible\b/i, /\bwhat\b.*\bbaggage\b.*\bpolicy\b/i,
          /\bbaggage\b.*\ballowance\b/i, /\bterms\b.*\bconditions\b/i, /\bwhat\b.*\bhappens\b.*\bif\b/i,
          /\bhow\b.*\blong\b.*\brefund\b/i, /\brefund\b.*\btimeline\b/i, /\bhow\b.*\blong\b.*\bget\b.*\bmoney\b/i
        ];

        if (policyPatterns.some(pattern => pattern.test(normalizedCustomerText))) {
          routingSource = 'PolicyDetector';
          finalCategory = 'Policy_Inquiry';
          
          logger.info('Intent Detected: Policy Inquiry', { event: 'IntentRouted', routingSource, category: finalCategory, latencyMs: Date.now() - startTime });
          
          return {
            primaryCategory: finalCategory,
            customerIntent: 'Customer requested policy or generic information.',
            sentiment: 'Neutral',
            confidence: 1.0,
            routingSource
          };
        }
      }

      // ==========================================
      // STAGE 2: ACTION DETECTOR (Fast Regex)
      // ==========================================
      const actionRules = [
        { category: 'Cancellation', intentDescription: 'Customer requested cancellation.', patterns: [/\bcancel\b.*\bbooking\b/i, /\bcancel\b.*\bticket\b/i, /\bcancel\b.*\bflight\b/i, /\bplease\b.*\bcancel\b/i, /\bwant\b.*\bcancel\b/i, /\bneed\b.*\bcancel\b/i, /\bhelp\b.*\bcancel\b/i, /^cancel it$/i] },
        { category: 'Refund', intentDescription: 'Customer requested a refund.', patterns: [/\brefund\b.*\bmy\b/i, /\bwhere\b.*\brefund\b/i, /\bneed\b.*\bmoney\b.*\bback\b/i, /\bprocess\b.*\brefund\b/i, /\bissue\b.*\brefund\b/i] },
        
        // 👉 UPDATED: Changed from 'Payments' to 'Payment Verification' and added better keywords
        { category: 'Payment Verification', intentDescription: 'Customer reported a payment issue or requested verification.', patterns: [/\bpay\b.*\bfor\b/i, /\bupdate\b.*\bpayment\b/i, /\bcard\b.*\bdeclined\b/i, /\bpayment\b.*\bfailed\b/i, /\btransaction\b/i, /\bpaid\b/i] },
        
        { category: 'Baggage', intentDescription: 'Customer requested baggage services.', patterns: [/\badd\b.*\bbaggage\b/i, /\badd\b.*\bluggage\b/i, /\blost\b.*\bbag\b/i, /\bmissing\b.*\bluggage\b/i] },
        { category: 'Booking', intentDescription: 'Customer requested a new reservation.', patterns: [/\bbook\b.*\bflight\b/i, /\bnew\b.*\breservation\b/i, /\bwant\b.*\bbook\b/i, /\bmake\b.*\bbooking\b/i] }
      ];

      for (const rule of actionRules) {
        if (rule.patterns.some(pattern => pattern.test(normalizedCustomerText))) {
          routingSource = 'ActionDetector';
          finalCategory = rule.category;
          
          logger.info('Intent Detected (Fast Action Regex)', { event: 'IntentRouted', routingSource, category: finalCategory, latencyMs: Date.now() - startTime });
          
          return {
            primaryCategory: finalCategory,
            customerIntent: rule.intentDescription,
            sentiment: 'Neutral',
            confidence: 1.0,
            routingSource
          };
        }
      }

      // ==========================================
      // STAGE 3: LLM ROUTER (Single API Call)
      // ==========================================
      routingSource = 'GeminiAPI_Classifier';
      const provider = ProviderFactory.getProvider(providerName);
      const transcript = ConversationPreprocessor.process(conversation);
      
      const intentPrompt = INTENT_DETECTION_PROMPT.replace('{transcript}', transcript);
      const llmResponse = await provider.generate(intentPrompt);
      const parsedData = ResponseParser.parse(llmResponse.rawText);

      // 👉 UPDATED: Added Payment Verification to the whitelist
      const validCategories = [
        'Refund', 
        'Reschedule', 
        'Booking', 
        'Baggage', 
        'Cancellation', 
        'Meal / Seat', 
        'Check-in', 
        'Visa / Travel Advisory',
        'Payment Verification',
        'Policy_Inquiry'
      ];
      
      finalCategory = parsedData.primaryCategory;

      if (finalCategory === 'General_Inquiry') {
        finalCategory = 'Policy_Inquiry';
      } else if (!validCategories.includes(finalCategory)) {
        finalCategory = 'Unknown';
      }

      finalConfidence = typeof parsedData.confidence === 'number' ? parsedData.confidence : 0.5;

      const latency = Date.now() - startTime;
      logger.info('Intent Detected (LLM Classifier)', {
        provider: providerName,
        latencyMs: latency,
        category: finalCategory,
        routingSource
      });

      return {
        primaryCategory: finalCategory,
        customerIntent: parsedData.customerIntent || 'Unknown',
        sentiment: parsedData.sentiment || 'Neutral',
        confidence: finalConfidence,
        routingSource
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error('Intent Detection Pipeline Failed', {
        provider: providerName,
        latencyMs: latency,
        error: error.message
      });
      
      if (error instanceof ApiError) throw error;
      throw new ApiError(502, 'Failed to detect intent and category.', 'PIPELINE_ERROR', [error.message]);
    }
  }
}

// 👉 FIXED: Syntax error on export
module.exports = new IntentDetectionService();