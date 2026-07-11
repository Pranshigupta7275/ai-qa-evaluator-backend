const { z } = require('zod');

const evaluateConversationSchema = z.object({
  body: z.object({
    conversation: z.array(
      z.object({
        speaker: z.string().min(1, 'Speaker cannot be empty'),
        message: z.string().min(1, 'Message cannot be empty')
      })
    ).min(1, 'Conversation must contain at least one message')
  })
});

// Export DIRECTLY without curly braces
module.exports = evaluateConversationSchema;