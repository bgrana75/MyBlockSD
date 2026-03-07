# My Block SD

**Hyper-local neighborhood intelligence for San Diego.** Enter any address and instantly get a comprehensive briefing — 311 service requests, development permits, traffic collisions, street sweeping schedules, fire/EMS incidents, live police dispatch, council district info, nearby civic facilities, and an AI assistant that can answer questions about your area.

Built for the **Claude AI Hackathon San Diego**, March 2026.

**Team:** Bryan Grana

## Live Deployment

| Layer | URL |
|-------|-----|
| **Frontend** | [https://myblocksd.xyz](https://myblocksd.xyz) |
| **API** | [https://api.myblocksd.xyz](https://api.myblocksd.xyz) |
| **MCP Server** | `https://api.myblocksd.xyz/mcp` (Streamable HTTP) |
| **Health Check** | [https://api.myblocksd.xyz/healthz](https://api.myblocksd.xyz/healthz) |

## Problem Statement

San Diego publishes a wealth of open data — 311 service requests, development permits, traffic collisions, fire/EMS incidents, street sweeping, council budgets, and more — but it's scattered across dozens of CSV files, GeoJSON endpoints, and web portals. No single tool lets a resident type in their address and see everything that matters for their block.

**My Block SD** solves this by ingesting 11 city data sources into a single backend, exposing them through both a polished web dashboard and an MCP server that any AI agent can query.

## What It Does

- **Neighborhood Briefing** — Stats ribbon showing 311 reports, permits, traffic collisions, and fire/EMS calls at a glance. Detailed sections for council district, nearby services, street sweeping schedule, collision breakdown, and recent reports.
- **Interactive Map** — Leaflet map with color-coded markers for 311 items, permits, libraries, fire stations, and rec centers.
- **Live SDPD Dispatch** — Real-time police dispatch calls filtered by neighborhood, auto-refreshing every 60 seconds.
- **AI Chat** — Floating chat modal powered by Claude with MCP tool access to all 11 datasets. Ask questions like "What are the biggest issues on my block?" or "How does this area compare to Hillcrest?"

## Data Sources (11 datasets)

| # | Source | Dataset | Records | Update |
|---|--------|---------|---------|--------|
| 1 | City of San Diego Open Data | **311 / Get It Done** — open service requests (potholes, graffiti, encampments, etc.) | ~68,000 | Daily |
| 2 | City of San Diego Open Data | **Development Permits** — building, solar, electrical, plumbing permits since 2024 | ~92,000 | Daily |
| 3 | City of San Diego Open Data | **Traffic Collisions** — police-reported collisions with injury/fatality/hit-run data (last 2 years) | ~15,000 | Daily |
| 4 | City of San Diego Open Data | **Fire/EMS Incidents** — fire and emergency medical responses by zip code (current year) | ~33,000 | Daily |
| 5 | City of San Diego Open Data | **Street Sweeping Schedules** — sweeping routes, schedules, posted/voluntary status per block | ~28,000 segments | Static |
| 6 | City of San Diego Open Data | **Council District Boundaries** — GeoJSON boundaries for all 9 districts + council member names | 9 districts | Static |
| 7 | City of San Diego Open Data | **Council District Budgets** — operating budget by district and fiscal year | 9 budgets | Annual |
| 8 | City of San Diego Open Data | **Libraries** — all public library locations with addresses and phone numbers | 37 | Static |
| 9 | City of San Diego Open Data | **Fire Stations** — all fire station locations with type and contact info | 88 | Static |
| 10 | City of San Diego Open Data | **Recreation Centers** — park rec centers with amenity info (gymnasium, etc.) | 64 | Static |
| 11 | SDPD Online | **Live Police Dispatch** — active calls for service scraped from SDPD web portal | Real-time | Every 5 min |

All City of San Diego data is sourced from [data.sandiego.gov](https://data.sandiego.gov) / [seshat.datasd.org](https://seshat.datasd.org). SDPD dispatch is scraped from the public [SDPD Online](https://webapps.sandiego.gov/sdpdonline/) portal.

## Architecture

```
┌─────────────────────────┐         ┌──────────────────────────────────┐
│   Next.js Frontend      │  HTTPS  │   Express Backend                │
│   (Vercel)              │ ──────► │   (Docker on dedicated server)   │
│                         │         │                                  │
│  • Address search       │         │  REST API:                       │
│  • Interactive map      │         │  • POST /api/briefing            │
│  • Briefing dashboard   │         │  • POST /api/live                │
│  • Live SDPD card       │         │  • POST /api/chat (SSE)          │
│  • Floating AI chat     │         │  • GET  /healthz, /readyz        │
│                         │         │                                  │
│                         │         │  MCP Server (Streamable HTTP):   │
│                         │         │  • POST /mcp (10 tools)          │
│                         │         │                                  │
│                         │         │  11 Data Services:               │
│                         │         │  • 311, Permits, Collisions      │
│                         │         │  • Fire/EMS, Sweeping, SDPD      │
│                         │         │  • Council Districts + Budgets   │
│                         │         │  • Libraries, Fire Stations,     │
│                         │         │    Rec Centers                   │
│                         │         │  • Geocoder (Nominatim)          │
│                         │         │  • Claude Agent (tool_use loop)  │
└─────────────────────────┘         └──────────────────────────────────┘
```

### Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4, Leaflet / react-leaflet
- **Backend**: Express.js 4, TypeScript, tsup build, ESM
- **MCP**: `@modelcontextprotocol/sdk` — Streamable HTTP, stateless mode, 10 tools
- **AI**: Anthropic SDK — Claude claude-sonnet-4-20250514 with tool_use loop calling MCP tools
- **Deployment**: Frontend on Vercel (auto-deploy from GitHub), backend in Docker (node:20-alpine) on dedicated server
- **Data ingestion**: CSV streaming via `csv-parse`, GeoJSON point-in-polygon via `@turf/boolean-point-in-polygon`, HTML scraping via `cheerio`

## Project Structure

```
apps/web/                        # Next.js frontend
  src/
    app/page.tsx                 # Dashboard layout, stats ribbon, floating AI chat
    components/
      AddressSearch.tsx          # Address input with autocomplete
      Map.tsx                    # Leaflet map (dynamic, no SSR)
      BriefingTab.tsx            # Neighborhood overview (311, permits, collisions, sweeping, fire, civic)
      RightNowTab.tsx            # Live SDPD dispatch card
      ChatPanel.tsx              # AI chat panel (used in floating modal)
    lib/api.ts                   # API client (fetch wrapper + SSE streaming)

services/myblock-server/         # Express backend
  src/
    index.ts                     # Entry point, data init sequence, route wiring
    services/
      data311.ts                 # 311 CSV download + haversine spatial query
      permits.ts                 # Permits CSV download + spatial query
      trafficCollisions.ts       # Collision CSV, index by police beat, query by street
      fireIncidents.ts           # Fire/EMS CSV, index by zip code
      streetSweeping.ts          # Sweeping CSV, street name normalization, address range lookup
      councilDistricts.ts        # GeoJSON point-in-polygon district lookup
      councilBudget.ts           # Operating budget by district
      civicPoints.ts             # Libraries, fire stations, rec centers (nearest-N queries)
      sdpdDispatch.ts            # SDPD HTML scrape + 5-min cache
      geocoder.ts                # Nominatim geocoding + LRU cache
      neighborhoodMap.ts         # SDPD ↔ standard neighborhood name mapping
      agent.ts                   # Claude agent with MCP tool_use loop
    routes/
      briefing.ts                # POST /api/briefing — full neighborhood briefing
      live.ts                    # POST /api/live — SDPD dispatch
      chat.ts                    # POST /api/chat — AI chat (SSE streaming)
      health.ts                  # GET /healthz, /readyz, /api/status
    mcp/server.ts                # MCP server — 10 tools, stateless Streamable HTTP
  Dockerfile                     # Multi-stage node:20-alpine build
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

The backend exposes an MCP endpoint at `https://api.myblocksd.xyz/mcp` using Streamable HTTP transport. Any MCP-compatible client (Claude Desktop, Cline, custom agents) can connect and use all 10 tools.

### Agent Skill File

The repo includes a [`SKILL.md`](SKILL.md) file — a structured skill definition that AI agents (such as [OpenClaw](https://openclaw.ai)) can use to understand when and how to invoke My Block tools. It describes all 10 tools with input/output specs, usage patterns, and response guidelines so any agent can provide San Diego neighborhood intelligence out of the box.

### Connecting from Claude Desktop / MCP Clients

```json
{
  "mcpServers": {
    "myblock-sd": {
      "url": "https://api.myblocksd.xyz/mcp"
    }
  }
}
```

Or via CLI:
```bash
claude mcp add myblock --transport http https://api.myblocksd.xyz/mcp
```

### Available MCP Tools (10)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `myblock.resolve_location` | Geocode an address to lat/lng + neighborhood + council district | `address` |
| `myblock.get_311` | 311 service requests near a location with stats | `lat`, `lng`, `radiusMiles`, `daysBack` |
| `myblock.get_permits` | Development permits near a location with stats | `lat`, `lng`, `radiusMiles`, `daysBack` |
| `myblock.get_live_sdpd` | Live SDPD police dispatch by neighborhood | `neighborhood` (uppercase, e.g. "NORTH PARK") |
| `myblock.get_briefing` | Full briefing: 311 + permits + SDPD + collisions + sweeping + civic + fire/EMS | `address`, `radiusMiles`, `daysBack` |
| `myblock.get_council_district` | Council district + representative for a location | `lat`, `lng` |
| `myblock.get_nearby_civic` | Nearest libraries, fire stations, and rec centers | `lat`, `lng`, `count` |
| `myblock.get_fire_incidents` | Fire/EMS incident stats by zip code (YTD) | `zip` |
| `myblock.get_traffic_collisions` | Traffic collision stats for a street (2-year window) | `streetName` |
| `myblock.get_street_sweeping` | Street sweeping schedule for a specific address | `addressNumber`, `streetName` |

## REST API

Base URL: `https://api.myblocksd.xyz`

### POST `/api/briefing`

Get a full neighborhood briefing for an address — 311 data, permits, collisions, sweeping, fire/EMS, council info, and nearby civic facilities.

```bash
curl -X POST https://api.myblocksd.xyz/api/briefing \
  -H 'Content-Type: application/json' \
  -d '{"address": "1600 Pacific Hwy, San Diego", "radiusMiles": 0.5}'
```

### POST `/api/live`

Get current SDPD police dispatch for a neighborhood.

```bash
curl -X POST https://api.myblocksd.xyz/api/live \
  -H 'Content-Type: application/json' \
  -d '{"neighborhood": "NORTH PARK"}'
```

### POST `/api/chat`

Chat with the AI assistant (Server-Sent Events stream).

```bash
curl -X POST https://api.myblocksd.xyz/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [{"role": "user", "content": "What are the top issues in North Park?"}],
    "locationContext": {"address": "3000 University Ave", "lat": 32.749, "lng": -117.129, "neighborhood": "North Park"}
  }'
```

### GET `/api/status`

Check data readiness, record counts, and refresh timestamps.

### GET `/healthz` / GET `/readyz`

Health and readiness probes.

## Safety

- **Not for emergencies** — if there's an emergency, call 911.
- All data is informational only. SDPD dispatch shows reported calls, not confirmed incidents.
- The AI assistant stays factual and does not speculate or share exact addresses from police data.

## License

MIT
