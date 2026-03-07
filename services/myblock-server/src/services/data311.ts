import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { readFileSync } from 'fs';
import { join } from 'path';


const DATA_311_URL = 'https://seshat.datasd.org/get_it_done_reports/get_it_done_requests_open_datasd.csv';

export interface Item311 {
  id: string;
  svc: string;
  st: string;
  lat: number;
  lng: number;
  dt: string;
  nbr: string;
  age: number;
}

interface ClosedStats {
  [neighborhood: string]: {
    [category: string]: { n: number; avg: number };
  };
}

let items: Item311[] = [];
let closedStats: ClosedStats = {};
let lastRefresh: Date | null = null;
let dataSource: 'portal' | 'fallback' = 'fallback';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function downloadAndParse311(): Promise<Item311[]> {
  const resp = await fetch(DATA_311_URL, {
    headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
    signal: AbortSignal.timeout(120_000),
  });
  if (!resp.ok) throw new Error(`311 CSV download failed: ${resp.status}`);

  const result: Item311[] = [];
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const parser = parse({ columns: true, skip_empty_lines: true });
  const readable = Readable.fromWeb(resp.body as any);
  readable.on('error', (err) => parser.destroy(err));
  readable.pipe(parser);

  for await (const row of parser) {
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    if (!lat || !lng) continue;
    const dt = (row.date_requested || '').slice(0, 10);
    if (dt < cutoffStr) continue;

    result.push({
      id: row.service_request_id,
      svc: row.service_name || '',
      st: row.status === 'In Process' ? 'I' : 'N',
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      dt,
      nbr: (row.comm_plan_name || '').toUpperCase(),
      age: parseInt(row.case_age_days) || 0,
    });
  }
  return result;
}

export async function initData311() {
  // Load closed stats from disk (always)
  closedStats = JSON.parse(readFileSync(join(process.cwd(), 'data/311_closed_stats.json'), 'utf-8'));

  try {
    const fresh = await downloadAndParse311();
    items = fresh;
    dataSource = 'portal';
    lastRefresh = new Date();
    console.log(`[311] Downloaded ${items.length} items from portal`);
  } catch (err) {
    console.warn(`[311] Download failed, loading fallback JSON:`, err);
    items = JSON.parse(readFileSync(join(process.cwd(), 'data/311_open.json'), 'utf-8'));
    dataSource = 'fallback';
    lastRefresh = new Date();
    console.log(`[311] Loaded ${items.length} items from fallback JSON`);
  }
}

export async function refreshData311(): Promise<number> {
  const fresh = await downloadAndParse311();
  items = fresh;
  dataSource = 'portal';
  lastRefresh = new Date();
  return items.length;
}

export function get311LastRefresh() { return lastRefresh; }
export function get311DataSource() { return dataSource; }
export function get311Count() { return items.length; }

export function queryByRadius(lat: number, lng: number, radiusMiles: number, daysBack?: number): Item311[] {
  const cutoff = daysBack
    ? new Date(Date.now() - daysBack * 86400000).toISOString().slice(0, 10)
    : null;
  return items.filter(item => {
    if (cutoff && item.dt < cutoff) return false;
    return haversineDistance(lat, lng, item.lat, item.lng) <= radiusMiles;
  });
}

export function computeStats(filteredItems: Item311[], neighborhood?: string) {
  const catCounts: Record<string, number> = {};
  let openCount = 0;

  for (const item of filteredItems) {
    catCounts[item.svc] = (catCounts[item.svc] || 0) + 1;
    if (item.st === 'I' || item.st === 'N') openCount++;
  }

  const topCategories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Avg close days from pre-aggregated closed stats
  let avgCloseDaysByCategory: { name: string; days: number }[] = [];
  if (neighborhood && closedStats[neighborhood]) {
    const nbrStats = closedStats[neighborhood];
    avgCloseDaysByCategory = Object.entries(nbrStats)
      .map(([name, { avg }]) => ({ name, days: avg }))
      .sort((a, b) => b.days - a.days);
  }

  return {
    total: filteredItems.length,
    open: openCount,
    topCategories,
    avgCloseDaysByCategory,
  };
}
