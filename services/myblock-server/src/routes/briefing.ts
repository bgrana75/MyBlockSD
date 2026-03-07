import { Router } from 'express';
import { z } from 'zod';
import { geocode } from '../services/geocoder.js';
import { queryByRadius, computeStats } from '../services/data311.js';
import { queryPermitsByRadius, computePermitStats } from '../services/permits.js';
import { resolveToSdpd } from '../services/neighborhoodMap.js';

export const briefingRouter = Router();

const BriefingSchema = z.object({
  address: z.string().min(1),
  radiusMiles: z.number().min(0.1).max(5).default(0.5),
  daysBack: z.number().min(1).max(3650).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

briefingRouter.post('/briefing', async (req, res) => {
  const parsed = BriefingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { address, radiusMiles, daysBack } = parsed.data;

  try {
    // Use provided lat/lng or geocode the address
    let lat = parsed.data.lat;
    let lng = parsed.data.lng;
    let neighborhood: string | null = null;
    let displayName = address;

    if (lat && lng) {
      // Use provided coordinates
    } else {
      const geo = await geocode(address);
      lat = geo.lat;
      lng = geo.lng;
      neighborhood = geo.neighborhood;
      displayName = geo.displayName;
    }

    const sdpdNeighborhood = resolveToSdpd(neighborhood);

    // Query data
    const items311 = queryByRadius(lat!, lng!, radiusMiles, daysBack);
    const stats311 = computeStats(items311, neighborhood || undefined);

    const permitItems = queryPermitsByRadius(lat!, lng!, radiusMiles, daysBack);
    const permitStats = computePermitStats(permitItems);

    res.json({
      location: {
        display: displayName,
        lat,
        lng,
        neighborhood: neighborhood || null,
        sdpdNeighborhood: sdpdNeighborhood || null,
      },
      datasets: {
        getItDone311: {
          items: items311.slice(0, 500),
          stats: stats311,
        },
        permits: {
          items: permitItems.slice(0, 500),
          stats: permitStats,
        },
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[briefing] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});
