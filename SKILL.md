# My Block — San Diego Neighborhood Intelligence

> **MCP endpoint**: `https://api.myblocksd.xyz/mcp`
> **Transport**: Streamable HTTP (POST)
> **Setup**: `claude mcp add myblock --transport http https://api.myblocksd.xyz/mcp`

## What is My Block?

My Block is a neighborhood intelligence service for San Diego. It gives you structured access to **11 city data sources** through 10 MCP tools:

1. **311 (Get It Done)** — ~68,000 open service requests (potholes, streetlights, graffiti, illegal dumping, encampments, etc.) with geolocation
2. **Development Permits** — ~92,000 active permits (building, solar, electrical, plumbing, etc.) since 2024
3. **Traffic Collisions** — ~15,000 police-reported collisions (last 2 years) with injury, fatality, and hit-and-run data
4. **Fire/EMS Incidents** — ~33,000 fire and emergency medical responses by zip code (current year)
5. **Street Sweeping** — ~28,000 sweeping segments with schedules, posted vs. voluntary status per block
6. **Council District Boundaries** — GeoJSON boundaries for all 9 San Diego City Council districts + member names
7. **Council District Budgets** — Operating budgets by district and fiscal year
8. **Public Libraries** — 37 library locations with addresses and contact info
9. **Fire Stations** — 88 fire station locations with type and contact info
10. **Recreation Centers** — 64 park recreation centers with amenity info
11. **SDPD Dispatch** — Live police dispatch entries, updated every 5 minutes

Data refreshes daily from the City of San Diego's Open Data Portal. SDPD dispatch is live-scraped.

## When to use this skill

Use My Block tools when:
- A user asks about a **San Diego neighborhood, address, or area**
- A user wants to know **what's happening** in a location (safety, infrastructure, construction, maintenance)
- A user is **comparing neighborhoods** (e.g., deciding where to live)
- A user asks about **city services, 311 reports, permits, police activity, fire incidents, or street sweeping** in San Diego
- A user needs **local context** for a San Diego address (e.g., "is this a good area?", "what's being built near me?", "when does my street get swept?")
- A user asks about **council districts, representatives, or budgets** in San Diego
- A user wants to find **nearby libraries, fire stations, or recreation centers**

Do NOT use these tools for:
- Locations outside San Diego
- Emergency situations (tell user to call 911)
- Submitting 311 reports (direct them to https://getitdone.sandiego.gov)

## Available tools

### `myblock.resolve_location`
Geocode a San Diego address to coordinates, neighborhood, and council district.

**Input**: `{ address: "3085 University Ave, San Diego, CA" }`
**Output**: `{ lat, lng, neighborhood, sdpdNeighborhood, displayName }`

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

### `myblock.get_live_sdpd`
Get current SDPD police dispatch entries for a neighborhood.

**Input**: `{ neighborhood: "NORTH PARK" }`
**Output**: Active incidents (dateTime, callType, division, neighborhood, blockAddress) + lastUpdated + stale flag

Neighborhood names must be uppercase SDPD names (e.g., "NORTH PARK", "HILLCREST", "PACIFIC BEACH", "DOWNTOWN", "LA JOLLA"). Use resolve_location first if you only have an address.

### `myblock.get_briefing`
Convenience tool — get everything at once for an address. Returns 311, permits, SDPD, council district, civic facilities, traffic collisions, street sweeping, and fire/EMS data.

**Input**: `{ address: "3085 University Ave, San Diego, CA", radiusMiles: 0.5, daysBack?: 90 }`
**Output**: Location + 311 items/stats + permits items/stats + SDPD incidents + council district + budget + civic (libraries, fire stations, rec centers) + traffic collisions + street sweeping + fire/EMS incidents

Use this when the user wants a comprehensive overview. Use individual tools when they ask specific questions.

### `myblock.get_council_district`
Look up which San Diego City Council district contains a location and who represents it.

**Input**: `{ lat: 32.748, lng: -117.129 }`
**Output**: `{ district, member, title }`

### `myblock.get_nearby_civic`
Find nearest libraries, fire stations, and recreation centers to a location.

**Input**: `{ lat: 32.748, lng: -117.129, count: 3 }`
**Output**: `{ libraries: [...], fireStations: [...], recCenters: [...] }` — each with name, address, distance in miles

### `myblock.get_fire_incidents`
Get fire and EMS incident statistics for a zip code. Current year data, updated daily.

**Input**: `{ zip: "92104" }`
**Output**: `{ total, byCategory: [...], recent: [...] }` — categories include Structure Fire, Medical, Traffic Collision, etc.

### `myblock.get_traffic_collisions`
Get traffic collision statistics for a street. Data from the last 2 years.

**Input**: `{ streetName: "University Ave" }`
**Output**: `{ total, totalInjured, totalKilled, hitAndRun, byChargeType: [...], recent: [...] }`

### `myblock.get_street_sweeping`
Look up the street sweeping schedule for a specific address.

**Input**: `{ addressNumber: 3085, streetName: "University Ave" }`
**Output**: `{ found, schedule, isPosted, segment, nearbySegments }` — schedule text like "Both Sides Odd Month 1st Wed", isPosted indicates if parking enforcement is active

## Usage patterns

### Neighborhood overview
```
1. Call get_briefing with the address
2. Summarize: top 311 categories, open reports, active permits, collision stats, sweeping schedule, council district, nearby services
3. Highlight anything notable (high volume of issues, large construction, active police calls, collision hotspots)
```

### Comparing neighborhoods
```
1. Call resolve_location for each address
2. Call get_311, get_permits, get_traffic_collisions for each location
3. Compare: which has more open issues? Different issue types? More construction? Safer streets?
```

### "What's happening right now?"
```
1. Call resolve_location to get the SDPD neighborhood name
2. Call get_live_sdpd with that neighborhood
3. Summarize active calls — be factual, no speculation about motives
```

### "When does my street get swept?"
```
1. Call get_street_sweeping with the house number and street name
2. Report the schedule, whether parking is enforced (posted vs voluntary), and note nearby segments
```

### "Is this street safe?"
```
1. Call get_traffic_collisions with the street name
2. Report total collisions, injuries, fatalities, hit-and-run rate
3. Note top charge types (e.g., unsafe speed, failure to yield)
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
