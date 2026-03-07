import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { readFileSync } from 'fs';
import { join } from 'path';


const PERMITS_URL = 'https://seshat.datasd.org/development_permits_set2/permits_set2_active_datasd.csv';

export interface Permit {
  id: string;
  type: string;
  st: string;
  addr: string;
  lat: number;
  lng: number;
  dt: string;
  iss?: string;
  ttl?: string;
  val?: number;
}

const TYPE_MAP: Record<string, string> = {
  'Traffic Control Permit': 'Traffic Control',
  'No-Plan - Residential - Combination Mech/Elec/Plum': 'Residential MEP',
  'Transportation Permit': 'Transportation',
  'Combination Building Permit': 'Building (Combo)',
  'Approval - Construction - Electrical Pmt - PV Combo': 'Solar PV',
  'Approval - Construction - Electrical Pmt-PV Combo': 'Solar PV',
  'Photovoltaic - SB 379': 'Solar PV',
  'Electrical Pmt': 'Electrical',
  'Building Permit': 'Building',
  'Approval - Construction - Right Of Way Pmt-Const Plan': 'Right-of-Way',
  'Mechanical Pmt': 'Mechanical',
  'Plumbing Pmt': 'Plumbing',
  'Construction Noise Permit': 'Construction Noise',
};

const STATUS_MAP: Record<string, string> = {
  'Issued': 'I',
  'Cancelled': 'X',
  'Opened': 'O',
  'Inspection Followup': 'IF',
  'Cancelled Application Expired': 'XE',
  'Approved Upon Final Payment': 'AP',
  'Pending Invoice Payment': 'PI',
  'Closed': 'C',
  'Open': 'O',
  'Withdrawn': 'W',
};

let permits: Permit[] = [];
let lastRefresh: Date | null = null;
let dataSource: 'portal' | 'fallback' = 'fallback';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function downloadAndParsePermits(): Promise<Permit[]> {
  const resp = await fetch(PERMITS_URL, {
    headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
    signal: AbortSignal.timeout(600_000), // 10 min timeout for 121 MB
  });
  if (!resp.ok) throw new Error(`Permits CSV download failed: ${resp.status}`);

  const result: Permit[] = [];
  const parser = parse({ columns: true, skip_empty_lines: true });
  const readable = Readable.fromWeb(resp.body as any);
  readable.on('error', (err) => parser.destroy(err));
  readable.pipe(parser);

  for await (const row of parser) {
    const lat = parseFloat(row.LAT_JOB);
    const lng = parseFloat(row.LNG_JOB);
    if (!lat || !lng) continue;
    const dt = (row.DATE_APPROVAL_CREATE || '').slice(0, 10);
    if (dt < '2024') continue;

    const rec: Permit = {
      id: row.APPROVAL_ID,
      type: TYPE_MAP[row.APPROVAL_TYPE] || row.APPROVAL_TYPE,
      st: STATUS_MAP[row.APPROVAL_STATUS] || (row.APPROVAL_STATUS || '').slice(0, 2),
      addr: row.ADDRESS_JOB,
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      dt,
    };
    const iss = (row.DATE_APPROVAL_ISSUE || '').slice(0, 10);
    if (iss) rec.iss = iss;
    const ttl = (row.PROJECT_TITLE || '').trim();
    if (ttl) rec.ttl = ttl.slice(0, 100);
    const val = parseFloat(row.APPROVAL_VALUATION);
    if (val && val > 0) rec.val = Math.round(val);
    result.push(rec);
  }
  return result;
}

export async function initPermits() {
  try {
    const fresh = await downloadAndParsePermits();
    permits = fresh;
    dataSource = 'portal';
    lastRefresh = new Date();
    console.log(`[permits] Downloaded ${permits.length} permits from portal`);
  } catch (err) {
    console.warn(`[permits] Download failed, loading fallback JSON:`, err);
    permits = JSON.parse(readFileSync(join(process.cwd(), 'data/permits.json'), 'utf-8'));
    dataSource = 'fallback';
    lastRefresh = new Date();
    console.log(`[permits] Loaded ${permits.length} permits from fallback JSON`);
  }
}

export async function refreshPermits(): Promise<number> {
  const fresh = await downloadAndParsePermits();
  permits = fresh;
  dataSource = 'portal';
  lastRefresh = new Date();
  return permits.length;
}

export function getPermitsLastRefresh() { return lastRefresh; }
export function getPermitsDataSource() { return dataSource; }
export function getPermitsCount() { return permits.length; }

export function queryPermitsByRadius(lat: number, lng: number, radiusMiles: number, daysBack?: number): Permit[] {
  const cutoff = daysBack
    ? new Date(Date.now() - daysBack * 86400000).toISOString().slice(0, 10)
    : null;
  return permits.filter(p => {
    if (cutoff && p.dt < cutoff) return false;
    return haversineDistance(lat, lng, p.lat, p.lng) <= radiusMiles;
  });
}

export function computePermitStats(filteredItems: Permit[]) {
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const p of filteredItems) {
    byType[p.type] = (byType[p.type] || 0) + 1;
    byStatus[p.st] = (byStatus[p.st] || 0) + 1;
  }
  return {
    total: filteredItems.length,
    byType: Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    byStatus: Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
  };
}
