import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { Express, Request, Response } from 'express';
import { geocode } from '../services/geocoder.js';
import { queryByRadius, computeStats } from '../services/data311.js';
import { queryPermitsByRadius, computePermitStats } from '../services/permits.js';
import { getByNeighborhood } from '../services/sdpdDispatch.js';
import { resolveToSdpd } from '../services/neighborhoodMap.js';
import { lookupDistrict } from '../services/councilDistricts.js';
import { nearestLibraries, nearestFireStations } from '../services/civicPoints.js';
import { queryFireIncidentsByZip } from '../services/fireIncidents.js';
import { getDistrictBudget } from '../services/councilBudget.js';

function createMcpServer() {
  const server = new McpServer({
    name: 'myblock',
    version: '1.0.0',
  });

  // Tool 1: resolve_location
  server.tool(
    'myblock.resolve_location',
    'Geocode a San Diego address to coordinates and neighborhood',
    { address: z.string().describe('Street address in San Diego') },
    async ({ address }) => {
      const result = await geocode(address);
      const sdpdNeighborhood = resolveToSdpd(result.neighborhood);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            lat: result.lat,
            lng: result.lng,
            neighborhood: result.neighborhood,
            sdpdNeighborhood,
            displayName: result.displayName,
          }),
        }],
      };
    }
  );

  // Tool 2: get_311
  server.tool(
    'myblock.get_311',
    'Get 311 (Get It Done) service requests near a location. Returns items and stats.',
    {
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
      radiusMiles: z.number().default(0.5).describe('Search radius in miles'),
      daysBack: z.number().optional().describe('Only include items from last N days'),
    },
    async ({ lat, lng, radiusMiles, daysBack }) => {
      const items = queryByRadius(lat, lng, radiusMiles, daysBack);
      const stats = computeStats(items);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ items: items.slice(0, 50), stats, totalItems: items.length }),
        }],
      };
    }
  );

  // Tool 3: get_permits
  server.tool(
    'myblock.get_permits',
    'Get active development permits near a location. Returns permits and stats.',
    {
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
      radiusMiles: z.number().default(0.5).describe('Search radius in miles'),
      daysBack: z.number().optional().describe('Only include permits from last N days'),
    },
    async ({ lat, lng, radiusMiles, daysBack }) => {
      const items = queryPermitsByRadius(lat, lng, radiusMiles, daysBack);
      const stats = computePermitStats(items);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ items: items.slice(0, 50), stats, totalItems: items.length }),
        }],
      };
    }
  );

  // Tool 4: get_live_sdpd
  server.tool(
    'myblock.get_live_sdpd',
    'Get current SDPD police dispatch entries for a neighborhood. Updated every 5 minutes.',
    {
      neighborhood: z.string().describe('SDPD neighborhood name, uppercase (e.g., NORTH PARK, HILLCREST)'),
    },
    async ({ neighborhood }) => {
      const result = getByNeighborhood(neighborhood);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result),
        }],
      };
    }
  );

  // Tool 5: get_briefing
  server.tool(
    'myblock.get_briefing',
    'Get a comprehensive neighborhood briefing for an address — 311 data, permits, and live SDPD combined.',
    {
      address: z.string().describe('Street address in San Diego'),
      radiusMiles: z.number().default(0.5).describe('Search radius in miles'),
      daysBack: z.number().optional().describe('Only include data from last N days'),
    },
    async ({ address, radiusMiles, daysBack }) => {
      const geo = await geocode(address);
      const sdpdNeighborhood = resolveToSdpd(geo.neighborhood);

      const items311 = queryByRadius(geo.lat, geo.lng, radiusMiles, daysBack);
      const stats311 = computeStats(items311, geo.neighborhood || undefined);

      const permitItems = queryPermitsByRadius(geo.lat, geo.lng, radiusMiles, daysBack);
      const permitStats = computePermitStats(permitItems);

      const sdpd = sdpdNeighborhood ? getByNeighborhood(sdpdNeighborhood) : null;

      const councilDistrict = lookupDistrict(geo.lat, geo.lng);
      const budget = councilDistrict ? getDistrictBudget(councilDistrict.district) : null;
      const libs = nearestLibraries(geo.lat, geo.lng, 3);
      const stations = nearestFireStations(geo.lat, geo.lng, 3);
      const fireIncidents = geo.zip ? queryFireIncidentsByZip(geo.zip) : null;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            location: {
              lat: geo.lat,
              lng: geo.lng,
              neighborhood: geo.neighborhood,
              sdpdNeighborhood,
              displayName: geo.displayName,
              zip: geo.zip,
              councilDistrict: councilDistrict
                ? { ...councilDistrict, budget: budget || undefined }
                : null,
            },
            getItDone311: { items: items311.slice(0, 50), stats: stats311, totalItems: items311.length },
            permits: { items: permitItems.slice(0, 50), stats: permitStats, totalItems: permitItems.length },
            sdpd,
            civic: { libraries: libs, fireStations: stations },
            fireIncidents: fireIncidents || undefined,
          }),
        }],
      };
    }
  );

  // Tool 6: get_council_district
  server.tool(
    'myblock.get_council_district',
    'Look up which San Diego City Council district contains a location and who represents it.',
    {
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
    },
    async ({ lat, lng }) => {
      const result = lookupDistrict(lat, lng);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result || { error: 'Location not within San Diego city council boundaries' }),
        }],
      };
    }
  );

  // Tool 7: get_nearby_civic
  server.tool(
    'myblock.get_nearby_civic',
    'Find nearest libraries and fire stations to a location in San Diego.',
    {
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
      count: z.number().default(3).describe('Number of nearest results per type'),
    },
    async ({ lat, lng, count }) => {
      const libs = nearestLibraries(lat, lng, count);
      const stations = nearestFireStations(lat, lng, count);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ libraries: libs, fireStations: stations }),
        }],
      };
    }
  );

  // Tool 8: get_fire_incidents
  server.tool(
    'myblock.get_fire_incidents',
    'Get fire and EMS incident statistics for a zip code in San Diego. Current year data updated daily.',
    {
      zip: z.string().describe('5-digit zip code (e.g., 92101)'),
    },
    async ({ zip }) => {
      const result = queryFireIncidentsByZip(zip);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result),
        }],
      };
    }
  );

  return server;
}

export function setupMcp(app: Express) {
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      const mcpServer = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless mode
      });

      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('[mcp] Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'MCP error' });
      }
    }
  });

  app.get('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method not allowed in stateless mode' });
  });

  app.delete('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method not allowed in stateless mode' });
  });
}
