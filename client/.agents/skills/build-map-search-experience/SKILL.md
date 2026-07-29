---
name: build-map-search-experience
description: "Build RoomRent MapLibre and location search. Use for markers, bounds, coordinates, geolocation, clustering, map/list sync, or URL filters."
---

# Build the map search experience

Keep maps useful, secure, accessible, and isolated from server rendering.

## Inspect the current map system

Read the relevant files before editing:

- `src/lib/map-style.ts`
- `src/components/search/results-map.tsx`
- `src/components/rooms/room-map.tsx`
- `src/components/rooms/room-map-lazy.tsx`
- `src/components/rooms/room-location-map.tsx`
- `src/features/rooms/api.ts`
- `src/features/rooms/search-params.ts`

RoomRent currently uses MapLibre GL with a shared OpenStreetMap raster style. Preserve attribution and avoid introducing a paid provider or API key unless explicitly requested.

## Rendering boundary

- Keep MapLibre code in a Client Component.
- Dynamically import `maplibre-gl`.
- Use a small `dynamic(..., { ssr: false })` wrapper when the surrounding page can stay server-rendered.
- Import MapLibre CSS exactly where the client bundle needs it.
- Keep address text, headings, and directions links server-renderable for SEO and no-JavaScript fallback.
- Provide a skeleton or honest fallback while the map loads.

## Coordinate rules

- Domain objects use named `latitude` and `longitude` fields.
- MapLibre arrays always use `[longitude, latitude]`.
- Google directions query text uses `latitude,longitude`.
- Check coordinates with `value != null`; zero is a valid coordinate.
- Validate latitude within `[-90, 90]` and longitude within `[-180, 180]` at input boundaries.
- Never silently swap values to make an invalid point appear valid.

## Lifecycle

- Create each Map instance once per mounted container.
- Store the map, markers, and mutable callbacks in refs.
- Remove markers, popups, listeners, and the map during cleanup.
- Guard asynchronous imports against unmount.
- Update marker data separately from map creation.
- Avoid depending on unstable callback identities; mirror callbacks into refs when marker listeners need the latest value.
- Do not recreate the map on every render or filter change.

## Search results map

1. Filter out rooms without complete coordinates.
2. Escape all user-controlled text before inserting popup or marker HTML.
3. Encode slugs used in links.
4. Build marker positions as `[room.longitude, room.latitude]`.
5. Fit bounds only when at least one located result exists.
6. Set padding and `maxZoom` so one marker does not zoom excessively.
7. Keep deterministic fallback center and zoom for zero located results.
8. Synchronize list hover/focus and marker active state.
9. Ensure marker buttons have accessible names when custom HTML is used.
10. Remove old markers before or during result replacement.

For large result sets, prefer GeoJSON sources and MapLibre layers with clustering rather than hundreds of DOM Marker instances. Keep DOM markers for modest page-sized results that need rich interactive content.

## URL and query synchronization

- Keep shareable filters in `nuqs`, not local map state.
- Normalize URL state with `toSearchParams` before building both query keys and HTTP queries.
- Keep UI-only flags out of backend requests.
- Do not refetch on every `move` event.
- If implementing “search this area,” store the settled viewport or bounds only after explicit user action or debounced `moveend`.
- Preserve pagination and sort semantics when viewport filters change.
- Avoid feedback loops where fitting result bounds triggers another search automatically.

## Listing detail map

- Show a map only when both coordinates exist.
- Show the full textual address regardless of coordinates.
- Provide a directions link using coordinates when present and the encoded address otherwise.
- Do not invent a pin from district or city center when a listing lacks exact coordinates.
- Consider privacy requirements before exposing exact landlord coordinates.

## Styling and providers

- Keep the tile style in `src/lib/map-style.ts`.
- Preserve OpenStreetMap attribution.
- Centralize provider URLs and keys in server-safe configuration.
- Never expose a secret key through `NEXT_PUBLIC_*`.
- Use design-system tokens for custom controls and markers where practical.
- Avoid embedding unescaped user content with `setHTML`.

## Accessibility and failure states

- Keep search results usable as a list without the map.
- Give custom marker buttons accessible labels and keyboard focus behavior.
- Do not make hover the only way to connect a card and marker.
- Provide loading and unavailable states without blocking the list.
- Treat missing coordinates as valid data absence, not a broken map.
- Keep directions as a normal external link with `noopener noreferrer`.

## Performance

- Preserve code splitting so MapLibre does not enter unrelated page bundles.
- Avoid loading the detail map before it approaches the viewport when page performance requires it.
- Debounce expensive viewport operations.
- Use stable marker IDs and update only what changed for larger sets.
- Consider clustering or layers before virtualization hacks.

## Verification

- Run lint, typecheck, and build for MapLibre or dynamic-import changes.
- Test zero, one, and many markers.
- Test missing and boundary coordinates.
- Test result replacement and component unmount for cleanup.
- Test keyboard access and list-only fallback.
- Mock MapLibre in unit tests; do not request real map tiles.
