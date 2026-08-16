import { NextRequest, NextResponse } from 'next/server';

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  'Hồ Chí Minh': [10.8231, 106.6297],
  'Hà Nội': [21.0285, 105.8542],
  'Đà Nẵng': [16.0544, 108.2022],
  'Cần Thơ': [10.0452, 105.7469],
  'Hải Phòng': [20.8449, 106.6881],
  'Bình Dương': [11.1648, 106.6508],
  'Đồng Nai': [10.9574, 106.8427],
  'Bà Rịa - Vũng Tàu': [10.4114, 107.1362],
  'Khánh Hòa': [12.2388, 109.1967],
  'Lâm Đồng': [11.9404, 108.4583],
  'Thừa Thiên Huế': [16.4637, 107.5909],
  'Quảng Nam': [15.5684, 108.4754],
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || !q.trim()) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  const query = q.trim();

  // Try Photon geocoding first (fast and reliable)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(photonUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        features?: Array<{
          geometry?: { coordinates?: [number, number] };
          properties?: { name?: string; city?: string; country?: string };
        }>;
      };
      if (data.features && data.features.length > 0) {
        const feat = data.features[0];
        const [lon, lat] = feat.geometry?.coordinates ?? [];
        if (lat && lon) {
          const result: GeocodeResult = {
            lat: String(lat),
            lon: String(lon),
            display_name: [feat.properties?.name, feat.properties?.city, feat.properties?.country]
              .filter(Boolean)
              .join(', '),
          };
          return NextResponse.json([result]);
        }
      }
    }
  } catch {
    // Continue to next provider
  }

  // Try Nominatim with server-side User-Agent
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      countrycodes: 'vn',
      limit: '1',
      q: query,
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'vi',
        'User-Agent': 'TroOi-Geocoding-Service/1.0 (contact@trooi.vn)',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const results = (await res.json()) as GeocodeResult[];
      if (Array.isArray(results) && results.length > 0) {
        return NextResponse.json(results);
      }
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to known city center if query contains city name
  for (const [cityName, [lat, lon]] of Object.entries(CITY_COORDINATES)) {
    if (query.toLowerCase().includes(cityName.toLowerCase())) {
      return NextResponse.json([
        {
          lat: String(lat),
          lon: String(lon),
          display_name: `${cityName}, Việt Nam`,
        },
      ]);
    }
  }

  return NextResponse.json([]);
}
