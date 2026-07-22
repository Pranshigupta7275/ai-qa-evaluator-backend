const AliasValidationService = require('./services/aliasValidation.service');

describe('AliasValidationService - Corendon Airlines SOP', () => {

    test('should pass using a real-world Corendon Airlines transcript (Alexandria & Connor)', () => {
        const conversation = [
            { role: 'customer', message: "Hey, I just got a nightmare of a website error while trying to cancel a ticket online. Zurich to Warsaw, this Friday, my friend's birthday, and I just got the worst email saying they can't process it. Can you just walk me through it?" },
            { role: 'agent', message: "Hello Alexandria, welcome to Corendon Airlines. My name is Connor I'm here to assist you today." },
            { role: 'customer', message: "Hey Connor, yeah I saw that. So about my ticket, how do I cancel it online step by step?" },
            { role: 'agent', message: "As I understand you connected to us regarding cancellation concern. Am I correct?" }
        ];
        
        const result = AliasValidationService.validate(conversation, 'Alexandria Hines', 'CONNOR');
        
        expect(result.passed).toBe(true);
        expect(result.observations[0].status).toBe('Passed');
        expect(result.observations[0].observation).toBe('No alias violations were detected across all support tiers.');
    });

    test('should pass a correct L1 agent greeting (Happy Path)', () => {
        const conversation = [
            { role: 'system', message: 'LARS has accepted this query' },
            { role: 'customer', message: 'Hi, I need help with my ticket.' },
            { role: 'agent', message: 'Hello Amanda, welcome to Corendon Airlines. My name is Lars and I am here to assist you today.' }
        ];
        const result = AliasValidationService.validate(conversation, 'Amanda Smith');
        
        expect(result.passed).toBe(true);
        expect(result.observations[0].status).toBe('Passed');
    });

    test('should fail if agent uses the wrong name (Agent Alias Violation)', () => {
        const conversation = [
            { role: 'system', message: 'LARS has accepted this query' },
            { role: 'agent', message: 'Hello Amanda, welcome to Corendon Airlines. My name is Rachael and I am here to assist you today.' }
        ];
        const result = AliasValidationService.validate(conversation, 'Amanda Smith');
        
        expect(result.passed).toBe(false);
        // FIXED: Capital 'Rachael'
        expect(result.observations[0].observation).toContain("introduced themselves as 'Rachael'");
    });

    test('should fail if agent addresses the wrong customer (Customer Alias Violation)', () => {
        const conversation = [
            { role: 'system', message: 'RUBEN has accepted this query' },
            { role: 'agent', message: 'Hello David, welcome to Corendon Airlines. This is Ruben here to assist you today.' }
        ];
        const result = AliasValidationService.validate(conversation, 'Amanda Smith');
        
        expect(result.passed).toBe(false);
        // FIXED: Capital 'David'
        expect(result.observations[0].observation).toContain("addressed the customer as 'David'");
    });

    test('should handle L1 to L2 escalations seamlessly (Multi-tier Happy Path)', () => {
        const conversation = [
            { role: 'system', message: 'LARS has accepted this query' },
            { role: 'agent', message: 'Hello Amanda, welcome to Corendon Airlines. My name is Lars.' },
            { role: 'system', message: 'System: Escalated to RUBEN' },
            { role: 'agent', message: 'Hello Amanda, welcome to Corendon Airlines. This is Ruben.' }
        ];
        const result = AliasValidationService.validate(conversation, 'Amanda Smith');
        
        expect(result.passed).toBe(true);
        expect(result.observations[0].observation).toBe('No alias violations were detected across all support tiers.');
    });

    test('should fail if L2 agent introduces themselves incorrectly after an escalation', () => {
        const conversation = [
            { role: 'system', message: 'LARS has accepted this query' },
            { role: 'agent', message: 'Hello Amanda, welcome to Corendon Airlines. My name is Lars.' },
            { role: 'system', message: 'System: Escalated to RUBEN' },
            { role: 'agent', message: 'Hello Amanda, welcome to Corendon Airlines. This is Koen.' }
        ];
        const result = AliasValidationService.validate(conversation, 'Amanda Smith');
        
        expect(result.passed).toBe(false);
        // FIXED: Capital 'Koen'
        expect(result.observations[0].observation).toContain("introduced themselves as 'Koen' instead of the system-assigned name 'RUBEN'");
    });

    test('should ignore agent messages that do not contain a greeting', () => {
        const conversation = [
            { role: 'system', message: 'KOEN has accepted this query' },
            { role: 'agent', message: 'I have successfully updated your ticket.' } 
        ];
        const result = AliasValidationService.validate(conversation, 'Amanda Smith');
        
        expect(result.passed).toBe(true); 
    });

    test('should gracefully handle empty or malformed conversation arrays', () => {
        const resultEmpty = AliasValidationService.validate([], 'Amanda Smith');
        expect(resultEmpty.passed).toBe(true);

        const resultMissingMessage = AliasValidationService.validate([{ role: 'agent' }], 'Amanda Smith');
        expect(resultMissingMessage.passed).toBe(true);
    });
});