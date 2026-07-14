const AliasValidationService = require('./services/aliasValidation.service');

describe('AliasValidationService - Deterministic Validations', () => {
    
    const validBaseConversation = [
        { role: 'system', speaker: 'System', message: 'LILY has accepted this query', timestamp: '14:46' },
        { role: 'customer', speaker: 'Harry Wilson', message: 'Hello', timestamp: '14:46' }
    ];

    it('should return PASS for correct agent alias (case-insensitive match)', () => {
        const convo = [...validBaseConversation, { role: 'agent', speaker: 'LILY', message: 'My name is Lily.' }];
        const result = AliasValidationService.validate(convo);
        expect(result.passed).toBe(true);
        expect(result.observations[0].status).toBe('Passed');
    });

    it('should return FAIL for incorrect agent alias (LILY vs Lilly)', () => {
        const convo = [...validBaseConversation, { role: 'agent', speaker: 'LILY', message: 'My name is Lilly.' }];
        const result = AliasValidationService.validate(convo);
        expect(result.passed).toBe(false);
        expect(result.observations[0].observation).toContain("'Lilly' instead of the assigned name 'LILY'");
    });

    it('should return FAIL for incorrect agent alias (Rachel vs Rachael)', () => {
        const convo = [
            { role: 'system', speaker: 'System', message: 'Rachel has accepted this query' },
            { role: 'agent', speaker: 'Rachel', message: "I'm Rachael." }
        ];
        const result = AliasValidationService.validate(convo);
        expect(result.passed).toBe(false);
        expect(result.observations[0].observation).toContain("'Rachael' instead of the assigned name 'RACHEL'");
    });

    it('should return PASS for correct customer name', () => {
        const convo = [...validBaseConversation, { role: 'agent', speaker: 'LILY', message: 'Hello Harry, how are you?' }];
        const result = AliasValidationService.validate(convo);
        expect(result.passed).toBe(true);
    });

    it('should return FAIL for wrong customer name', () => {
        const convo = [...validBaseConversation, { role: 'agent', speaker: 'LILY', message: 'Hello David, how are you?' }];
        const result = AliasValidationService.validate(convo);
        expect(result.passed).toBe(false);
        expect(result.observations[0].observation).toContain("addressed the customer as 'David' instead of 'Harry'");
    });

    it('should report multiple alias violations accurately', () => {
        const convo = [...validBaseConversation, { role: 'agent', speaker: 'LILY', message: 'Hello David. My name is Rachael.' }];
        const result = AliasValidationService.validate(convo);
        expect(result.passed).toBe(false);
        expect(result.observations.length).toBe(2);
    });

    it('should prevent duplicate alias violations in the same message', () => {
        const convo = [...validBaseConversation, { role: 'agent', speaker: 'LILY', message: 'Hello David. Please wait David.' }];
        const result = AliasValidationService.validate(convo);
        expect(result.passed).toBe(false);
        expect(result.observations.length).toBe(1); // Should only log 'David' once for this message
    });

    it('should safely handle empty or malformed conversation arrays', () => {
        expect(AliasValidationService.validate([]).passed).toBe(true);
        expect(AliasValidationService.validate(null).passed).toBe(true);
        expect(AliasValidationService.validate([ { invalid: 'data' } ]).passed).toBe(true);
    });

    it('should ignore greeting words, brands, cities, and weekdays', () => {
        const convo = [
            ...validBaseConversation,
            { role: 'agent', speaker: 'LILY', message: 'Hello team, thanks everyone. Have a good Monday in London using Apple.' }
        ];
        const result = AliasValidationService.validate(convo);
        expect(result.passed).toBe(true); 
    });
});