class AliasValidationService {
    /**
     * Validates agent and customer name aliases dynamically through escalations.
     * @param {Array} conversation - The chat log array containing message turns.
     * @param {String} expectedCustomerName - The actual name of the customer (e.g., 'Amanda Smith').
     * @param {String} [initialExpectedAgentName] - Optional starting agent name (if system prompt is missing).
     */
    static validate(conversation, expectedCustomerName, initialExpectedAgentName = null) {
        const observations = [];
        let passed = true;

        // Safely handle empty or malformed inputs (Satisfies the Jest array check)
        if (!Array.isArray(conversation) || conversation.length === 0) {
            return { passed: true, observations: [] };
        }

        // Target customer first name strictly lowercased
        const targetCustomer = expectedCustomerName ? expectedCustomerName.split(' ')[0].toLowerCase() : null;
        
        // This tracks the expected agent name, changing dynamically on escalations
        let currentExpectedAgent = initialExpectedAgentName ? initialExpectedAgentName.toLowerCase() : null; 

        // 1. System Handoff Patterns (L1 -> L2 -> L3)
        const systemAssignmentRegex = /^([a-z]+)\s+has accepted this query/i;
        const systemTransferRegex = /(?:transferred to|escalated to)\s+([a-z]+)/i;

        // 2. Strict Corendon Airlines Greeting Patterns
        const customerGreetingRegex = /hello\s+([a-z]+)[,.]?\s*welcome to corendon/i;
        const agentGreetingRegex = /(?:my name is|this is)\s+([a-z]+)/i;

        for (const turn of conversation) {
            if (!turn || !turn.message) continue;

            // STEP A: Listen for System Handoffs and Update the Expected Agent
            if (turn.role === 'system') {
                const match = turn.message.match(systemAssignmentRegex) || turn.message.match(systemTransferRegex);
                if (match) {
                    // Update the active agent taking over the chat
                    currentExpectedAgent = match[1].toLowerCase();
                }
                continue; // Move to the next turn
            }

            // STEP B: Validate Agent Greetings against the current expected names
            if (turn.role === 'agent') {
                const message = turn.message;
                const displayAgentName = currentExpectedAgent ? currentExpectedAgent.toUpperCase() : 'UNKNOWN';

                // 1. Validate the Customer's Name
                const customerMatch = message.match(customerGreetingRegex);
                if (customerMatch && targetCustomer) {
                    const spokenCustomerName = customerMatch[1].toLowerCase();
                    
                    if (spokenCustomerName !== targetCustomer) {
                        passed = false;
                        observations.push({
                            errorType: 'Alias Violation',
                            status: 'Failed',
                            chatEvidence: `[Agent - ${displayAgentName}]: ${message}`,
                            observation: `The agent addressed the customer as '${customerMatch[1]}' instead of the assigned name '${expectedCustomerName}'.`
                        });
                    }
                }

                // 2. Validate the Agent's Name
                const agentMatch = message.match(agentGreetingRegex);
                if (agentMatch && currentExpectedAgent) {
                    const spokenAgentName = agentMatch[1].toLowerCase();
                    
                    if (spokenAgentName !== currentExpectedAgent) {
                        passed = false;
                        observations.push({
                            errorType: 'Alias Violation',
                            status: 'Failed',
                            chatEvidence: `[Agent - ${displayAgentName}]: ${message}`,
                            observation: `The agent introduced themselves as '${agentMatch[1]}' instead of the system-assigned name '${displayAgentName}'.`
                        });
                    }
                }
            }
        }

        // STEP C: Final result formatting
        if (passed) {
            observations.push({
                errorType: 'Alias Violation',
                status: 'Passed',
                chatEvidence: null,
                observation: 'No alias violations were detected across all support tiers.'
            });
        }

        return { passed, observations };
    }
}

module.exports = AliasValidationService;