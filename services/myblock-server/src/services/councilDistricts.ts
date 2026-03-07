/**
 * Council Districts — point-in-polygon lookup using GeoJSON boundaries.
 * Data: https://seshat.datasd.org/gis_city_council_districts/council_districts_datasd.geojson
 */

const GEOJSON_URL = 'https://seshat.datasd.org/gis_city_council_districts/council_districts_datasd.geojson';

interface DistrictFeature {
  district: number;
  rings: [number, number][][]; // [lng, lat] rings (GeoJSON order)
}

// Current SD council members (2024-2028 term)
const COUNCIL_MEMBERS: Record<number, { name: string; title: string }> = {
  1: { name: 'Joe LaCava', title: 'Council President' },
  2: { name: 'Jennifer Campbell', title: 'Councilmember' },
  3: { name: 'Stephen Whitburn', title: 'Council President Pro Tem' },
  4: { name: 'Henry Foster III', title: 'Councilmember' },
  5: { name: 'Marni von Wilpert', title: 'Councilmember' },
  6: { name: 'Kent Lee', title: 'Councilmember' },
  7: { name: 'Raul Campillo', title: 'Councilmember' },
  8: { name: 'Vivian Moreno', title: 'Councilmember' },
  9: { name: 'Sean Elo-Rivera', title: 'Councilmember' },
};

let districts: DistrictFeature[] = [];

/** Ray-casting point-in-polygon test */
function pointInRing(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; // [lng, lat] in GeoJSON
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export async function initCouncilDistricts(): Promise<void> {
  try {
    const resp = await fetch(GEOJSON_URL, {
      headers: { 'User-Agent': 'MyBlock-SD-Hackathon/1.0' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) throw new Error(`Council districts download failed: ${resp.status}`);
    const geojson = await resp.json();

    districts = geojson.features.map((f: any) => {
      const geom = f.geometry;
      // Handle both Polygon and MultiPolygon
      const rings: [number, number][][] =
        geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat(1);
      return { district: f.properties.district, rings };
    });

    console.log(`[council] Loaded ${districts.length} council district boundaries`);
  } catch (err) {
    console.error('[council] Failed to load district boundaries:', err);
  }
}

export interface CouncilDistrictInfo {
  district: number;
  member: string;
  title: string;
}

export function lookupDistrict(lat: number, lng: number): CouncilDistrictInfo | null {
  for (const d of districts) {
    for (const ring of d.rings) {
      if (pointInRing(lat, lng, ring)) {
        const member = COUNCIL_MEMBERS[d.district];
        return {
          district: d.district,
          member: member?.name || 'Unknown',
          title: member?.title || 'Councilmember',
        };
      }
    }
  }
  return null;
}
