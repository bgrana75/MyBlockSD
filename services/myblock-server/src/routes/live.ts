import { Router } from 'express';
import { z } from 'zod';
import { getByNeighborhood } from '../services/sdpdDispatch.js';
import { resolveToSdpd, getAllSdpdNeighborhoods } from '../services/neighborhoodMap.js';

export const liveRouter = Router();

const LiveSchema = z.object({
  neighborhood: z.string().min(1),
});

liveRouter.post('/live', async (req, res) => {
  const parsed = LiveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { neighborhood } = parsed.data;

  // Try direct lookup first, then try mapping from geocoder name
  let sdpdName = neighborhood.toUpperCase().trim();
  let result = getByNeighborhood(sdpdName);

  // If no results, try resolving through the geocoder mapping
  if (result.total === 0) {
    const mapped = resolveToSdpd(neighborhood);
    if (mapped && mapped !== sdpdName) {
      sdpdName = mapped;
      result = getByNeighborhood(sdpdName);
    }
  }

  res.json({
    sdpd: result,
    neighborhood: sdpdName,
    allNeighborhoods: getAllSdpdNeighborhoods(),
  });
});
