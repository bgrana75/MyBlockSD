import Anthropic from '@anthropic-ai/sdk';
import { geocode } from './geocoder.js';
import { queryByRadius, computeStats } from './data311.js';
import { queryPermitsByRadius, computePermitStats } from './permits.js';
import { getByNeighborhood } from './sdpdDispatch.js';

const SYSTEM_PROMPT = `You are "My Block Assistant," a neighborhood intelligence agent for San Diego.

You have access to three city data sources via tools:
1. **311 (Get It Done)** — open service requests (potholes, streetlights, graffiti, etc.)
2. **Development Permits** — active building, solar, electrical permits
3. **SDPD Dispatch** — live police dispatch entries updated every 5 minutes

When a user asks about a neighborhood or address:
- Use resolve_location to geocode their address first
- Then call the appropriate data tools to gather information
- Synthesize a helpful, factual briefing

Rules:
- Be factual and calm. Never speculate about motives or blame.
- Do NOT include exact street addresses in your responses — use general area descriptions.
- Always remind users: "This is informational only — if there's an emergency, call 911."
- Keep responses concise but informative.
- When describing SDPD dispatch data, note that it shows reported calls, not confirmed incidents.
- Highlight actionable info: "You can report issues at getitdone.sandiego.gov"`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'resolve_location',
    description: 'Geocode a San Diego address to lat/lng and neighborhood name',
    input_schema: {
      type: 'object' as const,
      properties: {
        address: { type: 'string', description: 'Street address in San Diego' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_311',
    description: 'Get 311 (Get It Done) service requests near a location. Returns items and stats (top categories, open count, avg close times).',
    input_schema: {
      type: 'object' as const,
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        radiusMiles: { type: 'number', description: 'Search radius in miles (default 0.5)' },
        daysBack: { type: 'number', description: 'Only include items from last N days (optional)' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'get_permits',
    description: 'Get active development permits near a location. Returns permits and stats (by type, by status).',
    input_schema: {
      type: 'object' as const,
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        radiusMiles: { type: 'number', description: 'Search radius in miles (default 0.5)' },
        daysBack: { type: 'number', description: 'Only include permits from last N days (optional)' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'get_live_sdpd',
    description: 'Get current SDPD police dispatch entries for a neighborhood. Shows active calls updated every 5 minutes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        neighborhood: { type: 'string', description: 'SDPD neighborhood name (e.g., NORTH PARK, HILLCREST)' },
      },
      required: ['neighborhood'],
    },
  },
];

async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  switch (name) {
    case 'resolve_location': {
      const result = await geocode(input.address);
      return JSON.stringify(result);
    }
    case 'get_311': {
      const items = queryByRadius(input.lat, input.lng, input.radiusMiles || 0.5, input.daysBack);
      const stats = computeStats(items);
      return JSON.stringify({ items: items.slice(0, 50), stats, totalItems: items.length });
    }
    case 'get_permits': {
      const items = queryPermitsByRadius(input.lat, input.lng, input.radiusMiles || 0.5, input.daysBack);
      const stats = computePermitStats(items);
      return JSON.stringify({ items: items.slice(0, 50), stats, totalItems: items.length });
    }
    case 'get_live_sdpd': {
      const result = getByNeighborhood(input.neighborhood);
      return JSON.stringify(result);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

export async function* runAgent(
  messages: Anthropic.MessageParam[],
  locationContext?: { address: string; lat: number; lng: number; neighborhood: string }
): AsyncGenerator<{ type: 'text' | 'tool_use' | 'done'; content: string }> {
  const client = new Anthropic();

  const systemPrompt = locationContext
    ? `${SYSTEM_PROMPT}\n\nThe user is currently looking at: ${locationContext.address} (${locationContext.neighborhood}). Lat: ${locationContext.lat}, Lng: ${locationContext.lng}.`
    : SYSTEM_PROMPT;

  let currentMessages = [...messages];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: currentMessages,
    });

    // Emit text blocks immediately
    for (const block of response.content) {
      if (block.type === 'text') {
        yield { type: 'text', content: block.text };
      } else if (block.type === 'tool_use') {
        yield { type: 'tool_use', content: `Looking up ${block.name.replace('get_', '').replace('_', ' ')}...` };
      }
    }

    if (response.stop_reason === 'end_turn' || response.stop_reason !== 'tool_use') {
      yield { type: 'done', content: '' };
      return;
    }

    // Execute all tool calls and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await executeTool(block.name, block.input as Record<string, any>);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }
    }

    // Push assistant message once, then all tool results together
    currentMessages.push({ role: 'assistant', content: response.content });
    currentMessages.push({ role: 'user', content: toolResults });
  }
}
