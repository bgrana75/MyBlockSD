# My Block — San Diego Neighborhood Intelligence

> **MCP endpoint**: `https://api.myblocksd.xyz/mcp`
> **Transport**: Streamable HTTP (POST)
> **Setup**: `claude mcp add myblock --transport http https://api.myblocksd.xyz/mcp`

## What is My Block?

My Block is a neighborhood intelligence service for San Diego. It gives you structured, real-time access to three city data sources:

1. **311 (Get It Done)** — ~70,000 open service requests (potholes, streetlights, graffiti, illegal dumping, etc.) with geolocation
2. **Development Permits** — ~92,000 active permits (building, solar, electrical, plumbing, etc.) since 2024
3. **SDPD Dispatch** — Live police dispatch entries, updated every 5 minutes

Data refreshes daily from the City of San Diego's Open Data Portal. SDPD dispatch is live.

## When to use this skill

Use My Block tools when:
- A user asks about a **San Diego neighborhood, address, or area**
- A user wants to know **what's happening** in a location (safety, infrastructure, construction)
- A user is **comparing neighborhoods** (e.g., deciding where to live)
- A user asks about **city services, 311 reports, permits, or police activity** in San Diego
- A user needs **local context** for a San Diego address (e.g., "is this a good area?", "what's being built near me?")

Do NOT use these tools for:
- Locations outside San Diego
- Emergency situations (tell user to call 911)
- Submitting 311 reports (direct them to https://getitdone.sandiego.gov)

## Available tools

### `myblock.resolve_location`
Geocode a San Diego address to coordinates and neighborhood.

**Input**: `{ address: "3085 University Ave, San Diego, CA" }`
**Output**: `{ lat, lng, neighborhood, displayName }`

Use this first to get coordinates for the other tools.

### `myblock.get_311`
Get 311 (Get It Done) service requests near a location.

**Input**: `{ lat: 32.748, lng: -117.129, radiusMiles: 0.5, daysBack?: 90 }`
**Output**: Items (id, service type, status, date, coordinates, neighborhood) + stats (total, top categories, open count)

Common categories: Sidewalk Repair, Street Light Maintenance, Pothole, Graffiti, Illegal Dumping, Encampment, Parking Violations.

### `myblock.get_permits`
Get active development permits near a location.

**Input**: `{ lat: 32.748, lng: -117.129, radiusMiles: 0.5, daysBack?: 365 }`
**Output**: Permits (id, type, status, address, date, valuation) + stats (by type, by status)

Common types: Building, Solar PV, Electrical, Residential MEP, Traffic Control, Plumbing, Mechanical.
Status codes: I=Issued, O=Opened, X=Cancelled, IF=Inspection Followup.

### `myblock.get_live_sdpd`
Get current SDPD police dispatch entries for a neighborhood.

**Input**: `{ neighborhood: "NORTH PARK" }`
**Output**: Active incidents (dateTime, callType, division, neighborhood, blockAddress) + lastUpdated + stale flag

Neighborhood names must be uppercase SDPD names (e.g., "NORTH PARK", "HILLCREST", "PACIFIC BEACH", "DOWNTOWN", "LA JOLLA"). Use resolve_location first if you only have an address.

### `myblock.get_briefing`
Convenience tool — get everything at once for an address.

**Input**: `{ address: "3085 University Ave, San Diego, CA", radiusMiles: 0.5, daysBack?: 90 }`
**Output**: Location + 311 items/stats + permits items/stats + SDPD incidents

Use this when the user wants a comprehensive overview. Use individual tools when they ask specific questions.

## Usage patterns

### Neighborhood overview
```
1. Call get_briefing with the address
2. Summarize: top 311 categories, number of open reports, active permits, live dispatch activity
3. Highlight anything notable (high volume of a specific issue, large construction projects, active police calls)
```

### Comparing neighborhoods
```
1. Call resolve_location for each address
2. Call get_311 and get_permits for each location
3. Compare: which has more open issues? Different issue types? More construction?
```

### "What's happening right now?"
```
1. Call resolve_location to get the SDPD neighborhood name
2. Call get_live_sdpd with that neighborhood
3. Summarize active calls — be factual, no speculation about motives
```

### "Should I be concerned about [issue type]?"
```
1. Call get_311 with the location, filter results by the relevant category
2. Report count, trend (recent vs older), and if available, average resolution time
3. If relevant, mention they can report issues at getitdone.sandiego.gov
```

## Response guidelines

- Be **factual and calm**. Don't speculate about motives or assign blame.
- **Never include exact street addresses** in responses — use general area descriptions.
- When describing SDPD data, note these are **reported calls, not confirmed incidents**.
- Always remind: **"This is informational only — if there's an emergency, call 911."**
- For 311 issues, mention users can report at **getitdone.sandiego.gov**.
- Keep responses concise — focus on patterns and highlights, not listing every item.
