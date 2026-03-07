/**
 * Civic Points — libraries and fire stations with lat/lng.
 * Data: seshat.datasd.org CSV files with haversine nearest-N queries.
 */

import { parse } from 'csv-parse';
import { Readable } from 'stream';

const LIBRARIES_URL = 'https://seshat.datasd.org/gis_library_locations/libraries_datasd.csv';
const FIRE_STATIONS_URL = 'https://seshat.datasd.org/gis_fire_stations/fire_stations_datasd.csv';

export interface Library {
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}

export interface FireStation {
  name: string;
  stationNum: string;
  type: string;
  phone: string;
  lat: number;
  lng: number;
}

let libraries: Library[] = [];
let fireStations: FireStation[] = [];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function downloadCsv(url: string): Promise<Record<string, string>[]> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`CSV download failed: ${resp.status} for ${url}`);

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

export async function initCivicPoints(): Promise<void> {
  const results = await Promise.allSettled([
    downloadCsv(LIBRARIES_URL),
    downloadCsv(FIRE_STATIONS_URL),
  ]);

  if (results[0].status === 'fulfilled') {
    libraries = results[0].value
      .filter(r => parseFloat(r.lat) && parseFloat(r.lng))
      .map(r => ({
        name: r.name || '',
        address: r.address || '',
        phone: r.phone || '',
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
      }));
    console.log(`[civic] Loaded ${libraries.length} libraries`);
  } else {
    console.error('[civic] Libraries download failed:', results[0].reason);
  }

  if (results[1].status === 'fulfilled') {
    fireStations = results[1].value
      .filter(r => parseFloat(r.lat) && parseFloat(r.lng))
      .map(r => ({
        name: r.stat_name || '',
        stationNum: r.sta_num || '',
        type: r.stat_type || '',
        phone: r.phone_num || '',
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
      }));
    console.log(`[civic] Loaded ${fireStations.length} fire stations`);
  } else {
    console.error('[civic] Fire stations download failed:', results[1].reason);
  }
}

export interface NearbyResult<T> {
  item: T;
  distanceMiles: number;
}

export function nearestLibraries(lat: number, lng: number, n: number = 3): NearbyResult<Library>[] {
  return libraries
    .map(lib => ({ item: lib, distanceMiles: Math.round(haversineDistance(lat, lng, lib.lat, lib.lng) * 100) / 100 }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, n);
}

export function nearestFireStations(lat: number, lng: number, n: number = 3): NearbyResult<FireStation>[] {
  return fireStations
    .map(fs => ({ item: fs, distanceMiles: Math.round(haversineDistance(lat, lng, fs.lat, fs.lng) * 100) / 100 }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, n);
}
