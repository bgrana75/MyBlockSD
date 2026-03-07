/**
 * Fire/EMS Incidents — recent fire & emergency incidents by zip code.
 * Data: seshat.datasd.org yearly CSV files (updated daily).
 */

import { parse } from 'csv-parse';
import { Readable } from 'stream';

const BASE_URL = 'https://seshat.datasd.org/fire_ems_incidents';

export interface FireIncident {
  category: string;
  problem: string;
  zip: string;
  city: string;
  date: string;
}

let incidents: FireIncident[] = [];

async function downloadCsv(url: string): Promise<Record<string, string>[]> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) throw new Error(`Fire incidents download failed: ${resp.status}`);

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

export async function initFireIncidents(): Promise<void> {
  try {
    const currentYear = new Date().getFullYear();
    const url = `${BASE_URL}/fd_incidents_${currentYear}_datasd.csv`;
    const rows = await downloadCsv(url);

    incidents = rows
      .filter((r) => r.address_zip && r.call_category)
      .map((r) => ({
        category: r.call_category || '',
        problem: r.problem || '',
        zip: r.address_zip || '',
        city: r.address_city || '',
        date: r.date_response || '',
      }));

    // Sort newest first
    incidents.sort((a, b) => b.date.localeCompare(a.date));
    console.log(`[fire] Loaded ${incidents.length} fire/EMS incidents for ${currentYear}`);
  } catch (err) {
    console.error('[fire] Failed to load fire incidents:', err);
  }
}

export interface FireIncidentStats {
  total: number;
  byCategory: { name: string; count: number }[];
  recent: FireIncident[];
}

export function queryFireIncidentsByZip(zip: string, limit = 50): FireIncidentStats {
  const matching = incidents.filter((i) => i.zip === zip);

  const catCounts: Record<string, number> = {};
  for (const inc of matching) {
    catCounts[inc.category] = (catCounts[inc.category] || 0) + 1;
  }

  const byCategory = Object.entries(catCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: matching.length,
    byCategory,
    recent: matching.slice(0, limit),
  };
}
