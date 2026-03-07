import * as cheerio from 'cheerio';

export interface SdpdIncident {
  dateTime: string;
  callType: string;
  division: string;
  neighborhood: string;
  blockAddress: string;
}

let cachedData: SdpdIncident[] = [];
let lastUpdated: Date | null = null;
let stale = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchAndParse(): Promise<SdpdIncident[]> {
  const resp = await fetch('https://webapps.sandiego.gov/sdpdonline/', {
    headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`SDPD fetch failed: ${resp.status}`);
  const html = await resp.text();
  const $ = cheerio.load(html);
  const items: SdpdIncident[] = [];

  $('#myDataTable tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 5) {
      items.push({
        dateTime: $(cells[0]).text().trim(),
        callType: $(cells[1]).text().trim(),
        division: $(cells[2]).text().trim(),
        neighborhood: $(cells[3]).text().trim(),
        blockAddress: $(cells[4]).text().trim(),
      });
    }
  });
  return items;
}

async function poll() {
  try {
    const fresh = await fetchAndParse();
    cachedData = fresh;
    lastUpdated = new Date();
    stale = false;
    console.log(`[sdpd] Fetched ${fresh.length} incidents`);
  } catch (err) {
    console.error(`[sdpd] Fetch failed, serving stale data:`, err);
    stale = true;
  }
}

export function initSdpdCache() {
  // Fetch immediately, then every 5 minutes
  poll();
  pollTimer = setInterval(poll, 5 * 60 * 1000);
}

export function getByNeighborhood(neighborhood: string) {
  const upper = neighborhood.toUpperCase().trim();
  const filtered = cachedData.filter(i => i.neighborhood.toUpperCase() === upper);
  return {
    items: filtered,
    total: filtered.length,
    lastUpdated: lastUpdated?.toISOString() || null,
    stale,
  };
}

export function getSdpdStatus() {
  return {
    count: cachedData.length,
    lastUpdated: lastUpdated?.toISOString() || null,
    stale,
  };
}
