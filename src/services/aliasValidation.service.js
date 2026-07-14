/**
 * Alias Validation Service
 * Deterministically validates Agent and Customer names against SOPs using O(n) regex processing.
 */

const IGNORED_ENTITIES = new Set([
    // Greetings & Common conversational words
    'hello', 'hi', 'hey', 'thanks', 'thank', 'please', 'morning', 
    'afternoon', 'evening', 'today', 'yesterday', 'support', 
    'customer', 'agent', 'team', 'everyone', 'there', 'dear', 'wait',
    
    // STOP-WORDS (Fixes False Positives)
    'for', 'to', 'the', 'a', 'an', 'and', 'my', 'your', 'our',
    'escalating', 'going', 'sorry', 'sure', 'glad', 'happy', 
    'checking', 'looking', 'trying', 'working', 'not', 'here', 
    'just', 'still', 'can', 'could', 'would', 'will', 'doing',
    'transferring', 'sending', 'updating', 'reviewing',
    
    // Months & Weekdays
    'january', 'february', 'march', 'april', 'may', 'june', 
    'july', 'august', 'september', 'october', 'november', 'december',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    
    // Mock Configurable Entities (Brands, Cities, Countries, etc.)
    'apple', 'google', 'microsoft', 'amazon', 'london', 'york', 'india', 'usa', 'boost', 'mobile', 'motorola', 'edge'
]);

class AliasValidationService {
    /**
     * Validates a conversation array for alias compliance.
     * @param {Array} conversation - Array of message objects { role, speaker, message, timestamp }
     * @returns {Object} - { passed: Boolean, observations: Array }
     */
    static validate(conversation) {
        if (!Array.isArray(conversation) || conversation.length === 0) {
            return this._generateSuccessResult();
        }

        let assignedAgent = null;
        let customerFirstName = null;
        const violations = [];

        // --- Pass 1: Extraction (O(n)) ---
        for (const turn of conversation) {
            const role = turn.role?.toLowerCase();
            const speaker = turn.speaker || '';
            const msg = turn.message || '';

            // Rule 1: Extract Assigned Agent
            if (!assignedAgent && role === 'system') {
                const agentMatch = msg.match(/^([A-Za-z]+)\s+has accepted this query/i);
                if (agentMatch) {
                    assignedAgent = agentMatch[1].trim().toLowerCase();
                }
            }

            // Rule 2: Extract Customer First Name
            if (!customerFirstName && role === 'customer') {
                if (speaker && speaker.toLowerCase() !== 'customer') {
                    customerFirstName = speaker.split(' ')[0].trim().toLowerCase();
                }
            }
        }

        // --- Pass 2: Validation (O(n)) ---
        for (const turn of conversation) {
            if (turn.role?.toLowerCase() !== 'agent') continue;

            const msg = turn.message || '';
            const speakerName = turn.speaker ? turn.speaker.toUpperCase() : 'AGENT';
            const timestamp = turn.timestamp ? ` - ${turn.timestamp}` : '';
            const chatEvidence = `[Agent - ${speakerName}${timestamp}]: ${msg}`;
            
            // Set to prevent duplicate violation strings in the same message
            const messageViolations = new Set();

            // Validate Agent Introductions
            const introRegex = /(?:my name is|i am|i'm|this is(?: speaking)?|you are chatting with)\s+([A-Za-z]+)/gi;
            let introMatch;
            while ((introMatch = introRegex.exec(msg)) !== null) {
                const introducedName = introMatch[1].trim().toLowerCase();
                
                if (assignedAgent && introducedName !== assignedAgent && !IGNORED_ENTITIES.has(introducedName)) {
                    const expected = this._capitalize(assignedAgent).toUpperCase(); // e.g., "LILY"
                    const detected = this._capitalize(introducedName); // e.g., "Lilly"
                    
                    const obs = `The agent introduced themselves as '${detected}' instead of the assigned name '${expected}'.`;
                    if (!messageViolations.has(obs)) {
                        violations.push(this._createViolation(chatEvidence, obs));
                        messageViolations.add(obs);
                    }
                }
            }

            // Validate Customer Name Addressing
            const addressRegex = /(?:hello|hi|hey|thanks|thank you|good morning|good afternoon|good evening|please wait|dear)[,\s]+([A-Za-z]+)/gi;
            let addressMatch;
            while ((addressMatch = addressRegex.exec(msg)) !== null) {
                const addressedName = addressMatch[1].trim().toLowerCase();
                
                if (customerFirstName && addressedName !== customerFirstName && !IGNORED_ENTITIES.has(addressedName)) {
                    const expected = this._capitalize(customerFirstName);
                    const detected = this._capitalize(addressedName);
                    
                    const obs = `The agent addressed the customer as '${detected}' instead of '${expected}'.`;
                    if (!messageViolations.has(obs)) {
                        violations.push(this._createViolation(chatEvidence, obs));
                        messageViolations.add(obs);
                    }
                }
            }
        }

        // --- Return Formatted Results ---
        if (violations.length === 0) {
            return this._generateSuccessResult();
        }

        return {
            passed: false,
            observations: violations
        };
    }

    static _createViolation(evidence, observation) {
        return {
            errorType: "Alias Violation",
            status: "Failed",
            chatEvidence: evidence,
            observation: observation
        };
    }

    static _generateSuccessResult() {
        return {
            passed: true,
            observations: [
                {
                    errorType: "Alias Violation",
                    status: "Passed",
                    chatEvidence: null,
                    observation: "No alias violations were detected."
                }
            ]
        };
    }

    static _capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = AliasValidationService;