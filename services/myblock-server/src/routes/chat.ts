import { Router } from 'express';
import { z } from 'zod';
import { runAgent } from '../services/agent.js';

export const chatRouter = Router();

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  locationContext: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    neighborhood: z.string(),
  }).optional(),
});

chatRouter.post('/chat', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'Agent not available — no API key configured' });
    return;
  }

  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { messages, locationContext } = parsed.data;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    for await (const event of runAgent(messages, locationContext)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (err) {
    console.error('[chat] Agent error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Agent error — please try again' })}\n\n`);
  }

  res.end();
});
