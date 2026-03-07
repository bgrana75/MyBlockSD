/**
 * Traffic Collisions — crash reports with address + police beat.
 * Data: seshat.datasd.org CSV (2015-present, ~73K rows).
 * We match by street name + address number since there's no lat/lng.
 */

import { parse } from 'csv-parse';
import { Readable } from 'stream';

const CSV_URL = 'https://seshat.datasd.org/traffic_collisions/pd_collisions_datasd.csv';

export interface Collision {
  reportId: string;
  dateTime: string;
  policeBeat: string;
  address: string;
  chargeDesc: string;
  injured: number;
  killed: number;
  hitRunLevel: string;
}

let collisions: Collision[] = [];
// Index by police beat for fast queries
let byBeat: Map<string, Collision[]> = new Map();

async function downloadCsv(url: string): Promise<Record<string, string>[]> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
    signal: AbortSignal.timeout(120_000),
  });
  if (!resp.ok) throw new Error(`Collisions download failed: ${resp.status}`);

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

export async function initTrafficCollisions(): Promise<void> {
  try {
    const rows = await downloadCsv(CSV_URL);

    // Only keep last 2 years for memory
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 2);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    collisions = rows
      .filter(r => r.date_time && r.date_time >= cutoffStr)
      .map(r => {
        const addrParts = [r.address_no_primary, r.address_pd_primary, r.address_road_primary, r.address_sfx_primary]
          .map(s => (s || '').trim()).filter(Boolean).join(' ');
        return {
          reportId: r.report_id || '',
          dateTime: r.date_time || '',
          policeBeat: r.police_beat || '',
          address: addrParts,
          chargeDesc: r.charge_desc || '',
          injured: parseInt(r.injured) || 0,
          killed: parseInt(r.killed) || 0,
          hitRunLevel: r.hit_run_lvl || '',
        };
      });

    // Sort newest first
    collisions.sort((a, b) => b.dateTime.localeCompare(a.dateTime));

    // Build police beat index
    byBeat = new Map();
    for (const c of collisions) {
      if (!c.policeBeat) continue;
      const arr = byBeat.get(c.policeBeat) || [];
      arr.push(c);
      byBeat.set(c.policeBeat, arr);
    }

    console.log(`[collisions] Loaded ${collisions.length} traffic collisions (last 2 years), ${byBeat.size} beats`);
  } catch (err) {
    console.error('[collisions] Failed to load traffic collisions:', err);
  }
}

export interface CollisionStats {
  total: number;
  totalInjured: number;
  totalKilled: number;
  hitAndRun: number;
  byChargeType: { name: string; count: number }[];
  recent: Collision[];
}

export function queryCollisionsByBeat(beat: string, limit = 20): CollisionStats {
  const matching = byBeat.get(beat) || [];
  return buildStats(matching, limit);
}

export function queryCollisionsByStreet(streetName: string, limit = 20): CollisionStats {
  const upper = streetName.toUpperCase();
  const matching = collisions.filter(c => c.address.toUpperCase().includes(upper));
  return buildStats(matching, limit);
}

function buildStats(matching: Collision[], limit: number): CollisionStats {
  let totalInjured = 0;
  let totalKilled = 0;
  let hitAndRun = 0;
  const chargeCounts: Record<string, number> = {};

  for (const c of matching) {
    totalInjured += c.injured;
    totalKilled += c.killed;
    if (c.hitRunLevel) hitAndRun++;
    if (c.chargeDesc) {
      chargeCounts[c.chargeDesc] = (chargeCounts[c.chargeDesc] || 0) + 1;
    }
  }

  return {
    total: matching.length,
    totalInjured,
    totalKilled,
    hitAndRun,
    byChargeType: Object.entries(chargeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    recent: matching.slice(0, limit),
  };
}
