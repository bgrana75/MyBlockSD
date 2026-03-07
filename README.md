# My Block SD

**Hyper-local neighborhood intelligence for San Diego.** Enter any address and instantly see 311 service requests, development permits, live police dispatch, and ask an AI assistant about your area — all in one place.

Built for the Claude AI Hackathon San Diego, March 2026.

## What It Does

- **Briefing** — View open 311 (Get It Done) service requests near any address: top issue categories, average response times, and a sortable list of recent reports. Includes a direct link to report new issues.
- **Live** — Real-time SDPD dispatch calls filtered by neighborhood, auto-refreshing every 60 seconds.
- **Ask AI** — Chat with a Claude-powered assistant that has access to all local data via MCP tools. Ask questions like "What are the biggest issues on my block?" or "How does this area compare?"
- **Map** — Interactive Leaflet map with color-coded markers for 311 items and permits, centered on your searched address.

## Data Sources

| Source | Type | Update Frequency |
|--------|------|-----------------|
| [City of San Diego Open Data — Get It Done 311](https://data.sandiego.gov/) | Open requests CSV (~32MB) | Daily |
| [City of San Diego Open Data — Development Permits](https://data.sandiego.gov/) | Active permits CSV | Daily |
| [SDPD Dispatch Online](https://webapps.sandiego.gov/sdpdonline/) | Live police dispatch | Polled every 5 min |

## Architecture

```
┌────────────────────┐         ┌──────────────────────────┐
│   Next.js Frontend │  HTTPS  │   Express Backend        │
│   (Vercel)         │ ──────► │   (Docker on server)     │
│                    │         │                          │
│  • Address search  │         │  • /api/briefing (POST)  │
│  • Map (Leaflet)   │         │  • /api/live (GET)       │
│  • Briefing tab    │         │  • /api/chat (POST, SSE) │
│  • Live tab        │         │  • /mcp (MCP endpoint)   │
│  • Ask AI tab      │         │  • /healthz              │
│                    │         │                          │
│                    │         │  Services:               │
│                    │         │  • 311 data (CSV stream)  │
│                    │         │  • Permits (CSV stream)   │
│                    │         │  • SDPD (HTML scrape)     │
│                    │         │  • Geocoder (Nominatim)   │
│                    │         │  • Claude Agent (MCP)     │
└────────────────────┘         └──────────────────────────┘
```

- **Frontend**: Next.js 16 with TypeScript, Tailwind CSS, Leaflet/react-leaflet
- **Backend**: Express.js with TypeScript, tsup build, MCP SDK (Streamable HTTP), Anthropic SDK
- **AI**: Claude claude-sonnet-4-20250514 with tool_use loop — resolves locations, queries 311/permits/SDPD data via MCP tools
- **Deployment**: Frontend on Vercel (`myblocksd.xyz`), backend in Docker on dedicated server (`api.myblocksd.xyz`)

## Project Structure

```
apps/web/                    # Next.js frontend
  src/
    app/page.tsx             # Main page layout
    components/
      AddressSearch.tsx      # Address input + search
      Map.tsx                # Leaflet map (dynamic import, no SSR)
      BriefingTab.tsx        # 311 stats, permits, recent items
      RightNowTab.tsx        # Live SDPD dispatch
      ChatPanel.tsx          # AI chat (inline tab)
    lib/api.ts               # API client (fetch wrapper)

services/myblock-server/     # Express backend
  src/
    index.ts                 # Entry point, routes, data init
    services/
      data311.ts             # 311 CSV download + haversine query
      permits.ts             # Permits CSV download + query
      sdpdDispatch.ts        # SDPD HTML scrape + cache
      geocoder.ts            # Nominatim geocoding + cache
      neighborhoodMap.ts     # SDPD ↔ 311 neighborhood mapping
      agent.ts               # Claude agent with MCP tools
    routes/
      briefing.ts            # POST /api/briefing
      live.ts                # GET /api/live
      chat.ts                # POST /api/chat (SSE streaming)
      health.ts              # GET /healthz
    mcp/server.ts            # MCP server (Streamable HTTP)
  Dockerfile                 # Multi-stage node:20-alpine
  docker-compose.yml
```

## Running Locally

### Backend

```bash
cd services/myblock-server
npm install
cp .env.example .env  # Add your ANTHROPIC_API_KEY
npm run dev            # Starts on http://localhost:8080
```

### Frontend

```bash
cd apps/web
npm install
npm run dev            # Starts on http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8080` in `apps/web/.env.local` for local backend.

## Deploying

### Backend (Docker)

```bash
cd services/myblock-server
docker compose up -d --build
```

The container downloads fresh data from the San Diego Open Data Portal on startup and refreshes every 24 hours.

### Frontend (Vercel)

Connect the GitHub repo to Vercel, set root directory to `apps/web`, and add `NEXT_PUBLIC_API_URL` pointing to your backend.

## MCP Integration

The backend exposes an MCP endpoint at `/mcp` using Streamable HTTP transport. Available tools:

| Tool | Description |
|------|-------------|
| `myblock.resolve_location` | Geocode an address to lat/lng + neighborhood |
| `myblock.get_311` | Query 311 service requests by radius |
| `myblock.get_permits` | Query development permits by radius |
| `myblock.get_live_sdpd` | Get live SDPD dispatch by neighborhood |
| `myblock.get_briefing` | Full briefing (311 + permits + stats) |

## Safety

- **Not for emergencies** — if there's an emergency, call 911.
- All data is informational only. SDPD dispatch shows reported calls, not confirmed incidents.
- The AI assistant stays factual and does not speculate or share exact addresses from police data.

## License

MIT
