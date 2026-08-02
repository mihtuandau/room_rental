/**
 * Keyless OpenStreetMap raster tiles — street-level detail with no API key and
 * no billing account required, so the map works out of the box. Shared by the
 * search results map and the listing detail map. For production, swapping in
 * a MapTiler/Mapbox vector style (+ key) gives higher rate limits.
 */
export const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
};

/** Paint values for the home radius overlay, kept beside the shared map style. */
export const HOME_MAP_COLORS = {
  radiusFill: '#008f6a',
  radiusLine: '#00765a',
} as const;
