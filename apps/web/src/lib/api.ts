const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.myblocksd.xyz';

export async function getBriefing(address: string, radiusMiles = 0.5) {
  const resp = await fetch(`${BASE}/api/briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, radiusMiles }),
  });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function getLive(neighborhood: string) {
  const resp = await fetch(`${BASE}/api/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ neighborhood }),
  });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function getStatus() {
  const resp = await fetch(`${BASE}/api/status`);
  return resp.json();
}

export async function streamChat(
  messages: { role: string; content: string }[],
  locationContext: { address: string; lat: number; lng: number; neighborhood: string } | undefined,
  onEvent: (event: { type: string; content: string }) => void,
) {
  const resp = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, locationContext }),
  });

  if (resp.status === 503) throw new Error('Agent not available');
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));
          onEvent(event);
        } catch { /* skip malformed */ }
      }
    }
  }
}
