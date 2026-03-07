interface GeoResult {
  lat: number;
  lng: number;
  neighborhood: string | null;
  displayName: string;
  zip: string | null;
}

const cache = new Map<string, GeoResult>();

export async function geocode(address: string): Promise<GeoResult> {
  const key = address.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '1');

  const resp = await fetch(url.toString(), {
    headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
  });
  const data = await resp.json() as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string>;
  }>;
  if (!data.length) throw new Error('Address not found');

  const item = data[0];
  const addr = item.address || {};
  const neighborhood = addr.suburb || addr.quarter || addr.neighbourhood || null;

  const result: GeoResult = {
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    neighborhood: neighborhood?.toUpperCase() || null,
    displayName: item.display_name,
    zip: addr.postcode || null,
  };

  cache.set(key, result);
  return result;
}
