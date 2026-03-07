import { Router } from 'express';
import { z } from 'zod';
import { geocode } from '../services/geocoder.js';
import { queryByRadius, computeStats } from '../services/data311.js';
import { queryPermitsByRadius, computePermitStats } from '../services/permits.js';
import { resolveToSdpd } from '../services/neighborhoodMap.js';
import { lookupDistrict } from '../services/councilDistricts.js';
import { nearestLibraries, nearestFireStations, nearestRecCenters } from '../services/civicPoints.js';
import { queryFireIncidentsByZip } from '../services/fireIncidents.js';
import { getDistrictBudget } from '../services/councilBudget.js';
import { queryCollisionsByStreet } from '../services/trafficCollisions.js';
import { lookupSweeping } from '../services/streetSweeping.js';

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
    let zip: string | null = null;
    let houseNumber: string | null = null;
    let road: string | null = null;

    if (lat && lng) {
      // Use provided coordinates
    } else {
      const geo = await geocode(address);
      lat = geo.lat;
      lng = geo.lng;
      neighborhood = geo.neighborhood;
      displayName = geo.displayName;
      zip = geo.zip;
      houseNumber = geo.houseNumber;
      road = geo.road;
    }

    const sdpdNeighborhood = resolveToSdpd(neighborhood);

    // Query data
    const items311 = queryByRadius(lat!, lng!, radiusMiles, daysBack);
    const stats311 = computeStats(items311, neighborhood || undefined);

    const permitItems = queryPermitsByRadius(lat!, lng!, radiusMiles, daysBack);
    const permitStats = computePermitStats(permitItems);

    // Council district + civic amenities
    const councilDistrict = lookupDistrict(lat!, lng!);
    const libraries = nearestLibraries(lat!, lng!, 3);
    const fireStationsNearby = nearestFireStations(lat!, lng!, 3);

    // Fire/EMS incidents by zip
    const fireIncidents = zip ? queryFireIncidentsByZip(zip) : null;

    // Council budget
    const budget = councilDistrict ? getDistrictBudget(councilDistrict.district) : null;

    // Rec centers
    const recCentersNearby = nearestRecCenters(lat!, lng!, 3);

    // Traffic collisions by street
    const collisions = road ? queryCollisionsByStreet(road) : null;

    // Street sweeping
    const sweeping = (houseNumber && road)
      ? lookupSweeping(parseInt(houseNumber), road)
      : null;

    res.json({
      location: {
        display: displayName,
        lat,
        lng,
        neighborhood: neighborhood || null,
        sdpdNeighborhood: sdpdNeighborhood || null,
        zip: zip || null,
        councilDistrict: councilDistrict
          ? { ...councilDistrict, budget: budget || undefined }
          : null,
      },
      datasets: {
        getItDone311: {
          items: [...items311].sort((a, b) => b.dt.localeCompare(a.dt)).slice(0, 500),
          stats: stats311,
        },
        permits: {
          items: [...permitItems].sort((a, b) => b.dt.localeCompare(a.dt)).slice(0, 500),
          stats: permitStats,
        },
      },
      civic: {
        libraries,
        fireStations: fireStationsNearby,
        recCenters: recCentersNearby,
      },
      fireIncidents: fireIncidents || undefined,
      trafficCollisions: collisions || undefined,
      streetSweeping: sweeping || undefined,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[briefing] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});
