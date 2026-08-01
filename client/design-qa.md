# Homepage design QA

## Scope

The public homepage hero was updated from an image banner to a two-column search experience. The left side contains the primary search controls and the right side contains an interactive MapLibre/OpenStreetMap map with a visible radius area and room markers.

## Evidence

- Source reference: `D:\room_rental\.codex-audit\home-redesign\source-layout.png`
- Earlier responsive captures: `D:\room_rental\.codex-audit\home-redesign\home-desktop.png`, `home-mobile.png`
- Browser verification: desktop viewport at 1440x1000, mobile layout checked at 390px wide.

## Checks

- Desktop hero: search panel and map form a balanced two-column layout inside the shared max-width shell.
- Map: OpenStreetMap tiles load, navigation controls and attribution render, radius overlay is drawn, and room markers inside the selected radius show image/price popovers.
- Responsive: map keeps a minimum usable height on narrow screens and the hero collapses to one column.
- Below the hero: stats, compact categories, featured rooms, trust reasons, landlord CTA and footer keep the same brand colors and spacing system.
- Search: radius is selectable in the UI, filters visible map markers locally, and is reflected in the map overlay. The current room-search API has no radius parameter, so server-side radius filtering is not claimed yet.

## Findings resolved

- Replaced the old hero image/carousel with the requested map-first hero composition.
- Moved search controls into the first visual block so they are immediately visible.
- Fixed the MapLibre container height issue that produced an empty map canvas by using a full-height container and resize observer.
- Kept map paint colors centralized in `src/lib/map-style.ts`.

## Verification result

`pnpm run typecheck` and `pnpm run lint` pass. Production build is currently blocked by the environment being unable to fetch Google Fonts (`Inter`) from `fonts.googleapis.com`; this is unrelated to the homepage/map code.

Result: passed for the implemented UI and map behavior; production build requires network access or a local font fallback.
