/**
 * Street Sweeping Schedule — sweeping schedule per street segment.
 * Data: seshat.datasd.org CSV (~28K rows).
 * Matches by street name + address number to return user's sweeping schedule.
 */

import { parse } from 'csv-parse';
import { Readable } from 'stream';

const CSV_URL = 'https://seshat.datasd.org/gis_street_sweeping/street_sweeping_datasd.csv';

export interface SweepingSegment {
  street: string;
  leftLow: number;
  leftHigh: number;
  rightLow: number;
  rightHigh: number;
  crossStreet1: string;
  crossStreet2: string;
  zip: string;
  councilDistrict: string;
  posted: string;        // 'P' = posted (enforce), 'NP' = not posted (voluntary)
  schedule: string;      // e.g. "Not Posted, Both Sides 4th Mon"
  schedule2: string;
}

let segments: SweepingSegment[] = [];
// Index by normalized street name for fast lookups
let byStreet: Map<string, SweepingSegment[]> = new Map();

function normalizeStreet(s: string): string {
  return s.toUpperCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

async function downloadCsv(url: string): Promise<Record<string, string>[]> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) throw new Error(`Sweeping download failed: ${resp.status}`);

  const rows: Record<string, string>[] = [];
  const csvParser = parse({ columns: true, skip_empty_lines: true });
  const readable = Readable.fromWeb(resp.body as any);
  readable.on('error', (err) => csvParser.destroy(err));
  readable.pipe(csvParser);

  for await (const row of csvParser) {
    rows.push(row);
  }
  return rows;
}

export async function initStreetSweeping(): Promise<void> {
  try {
    const rows = await downloadCsv(CSV_URL);

    segments = rows.map(r => ({
      street: (r.rd20full || '').trim(),
      leftLow: parseInt(r.llowaddr) || 0,
      leftHigh: parseInt(r.lhighaddr) || 0,
      rightLow: parseInt(r.rlowaddr) || 0,
      rightHigh: parseInt(r.rhighaddr) || 0,
      crossStreet1: (r.xstrt1 || '').trim(),
      crossStreet2: (r.xstrt2 || '').trim(),
      zip: (r.zip || '').trim(),
      councilDistrict: (r.cdcode || '').trim(),
      posted: (r.posted || '').trim(),
      schedule: (r.schedule || '').trim(),
      schedule2: (r.schedule2 || '').trim(),
    }));

    byStreet = new Map();
    for (const seg of segments) {
      const key = normalizeStreet(seg.street);
      if (!key) continue;
      const arr = byStreet.get(key) || [];
      arr.push(seg);
      byStreet.set(key, arr);
    }

    console.log(`[sweeping] Loaded ${segments.length} street sweeping segments, ${byStreet.size} streets`);
  } catch (err) {
    console.error('[sweeping] Failed to load street sweeping:', err);
  }
}

export interface SweepingResult {
  found: boolean;
  segment: SweepingSegment | null;
  schedule: string;
  isPosted: boolean;
  nearbySegments: SweepingSegment[];
}

/**
 * Look up the sweeping schedule for a specific address.
 * addressNum: house number (e.g. 1453)
 * streetName: street name from geocoded address (e.g. "Robinson Ave")
 */
export function lookupSweeping(addressNum: number, streetName: string): SweepingResult {
  const key = normalizeStreet(streetName);
  const streetSegments = byStreet.get(key) || [];

  // Find the segment whose address range contains our house number
  const match = streetSegments.find(s => {
    const inLeft = addressNum >= s.leftLow && addressNum <= s.leftHigh;
    const inRight = addressNum >= s.rightLow && addressNum <= s.rightHigh;
    return inLeft || inRight;
  });

  if (match) {
    return {
      found: true,
      segment: match,
      schedule: match.schedule,
      isPosted: match.posted === 'P',
      nearbySegments: streetSegments.filter(s => s !== match).slice(0, 3),
    };
  }

  // No exact match — return nearby segments on same street
  return {
    found: false,
    segment: null,
    schedule: streetSegments.length > 0 ? streetSegments[0].schedule : '',
    isPosted: streetSegments.length > 0 ? streetSegments[0].posted === 'P' : false,
    nearbySegments: streetSegments.slice(0, 3),
  };
}

/**
 * Look up sweeping segments by zip code to get general schedule info.
 */
export function sweepingByZip(zip: string): SweepingSegment[] {
  return segments.filter(s => s.zip === zip).slice(0, 5);
}
