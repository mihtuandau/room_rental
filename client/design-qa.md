# Homepage hero design QA

## Source visual truth

- Source visual: `C:\Users\TUAN\AppData\Local\Temp\codex-clipboard-6bb56789-fd47-4c1a-ab0d-ddd2ef58b05b.png`
- Source dimensions: 1487 × 1058 px.
- Selected direction: option 1, map illustration replacing the photo carousel.

## Implementation evidence

- Implementation: `D:\room_rental\client\src\components\home\home-hero.tsx`
- Production asset: `D:\room_rental\client\public\hero-district-1-map.png`
- Mobile production asset: `D:\room_rental\client\public\hero-district-1-map-mobile-balanced.png`
- Desktop capture: `D:\room_rental\hero-district-1-check.png`
- Mobile capture: `D:\room_rental\hero-background-mobile-check.png`
- Combined comparison: `D:\room_rental\design-qa-comparison.png`
- Desktop viewport: 1265 × 710 CSS px, device scale factor 1.
- Mobile viewport: 390 × 844 CSS px, device scale factor 1.
- State: public homepage, unauthenticated, default search state.

## Comparison

- Full view: the implementation preserves RoomRent's existing navigation, Vietnamese copy, search form, stats, and page flow while replacing the photo carousel with the selected map visual.
- Focused hero region: the new map illustration is a District 1 city-center composition with a highlighted apartment building, central landmarks, riverfront, and location pins. Its pale paper canvas is intentionally retained so the artwork can dissolve into the page through the four-edge mask instead of reading as a pasted rectangle.
- Banner framing: the hero uses the source aspect ratio inside a capped desktop map frame, with a small amount of illustration bleed into the left content area.
- Typography: existing product typography and copy remain the source of truth; the generated source's alternate copy is not copied into the application.
- Layout rhythm: the left search column stays primary while the artwork remains visually secondary on the right and softly connects to the copy/form area without taking a layout column or introducing a hard left/right boundary.
- Colors/tokens: layout styling uses existing RoomRent brand and surface tokens. No new raw brand color was added to the component.
- Asset fidelity: the generated desktop artwork is displayed as a wide illustration and the mobile artwork as a dedicated wide composition sized for the lower mobile hero visual. The mobile production asset bakes a soft warm-white fade from the bottom upward so the illustration dissolves into the hero surface instead of ending as a separate image strip; its horizontal composition keeps that fade visible under `object-cover`. Their pale canvases are retained and blended with the page surface through `mix-blend-mode: multiply` plus edge masking.
- Responsive check: desktop uses the wide map as a background, while mobile uses a dedicated full-width lower-hero map visual after the search form. Its top edge fades into the form area and the full-width composition avoids portrait cropping or a tiny floating map; the layout remains without horizontal page overflow (`scrollWidth` 375 px, `clientWidth` 375 px on the previous mobile capture).
- Desktop overflow check after full-width banner and wave: `scrollWidth` equals `clientWidth` at 1265 px.
- Console check: no warning or error entries were reported during the final browser capture.

## Comparison history

- P2: The map's right and bottom edges still looked clipped because the fade masks only covered the left/top treatment, leaving the artwork visible up to the hero boundary.
- Fixed: Kept the wrapper matched to the generated map ratio (`aspect-[1717/916]`) and applied intersecting horizontal and vertical masks so the pale canvas and illustration fade on the left, right, top, and bottom before reaching the section boundary.
- Post-fix desktop capture: `D:\room_rental\hero-district-1-check.png` confirms the illustration remains clear in the center-right while all four edges dissolve naturally into the page.
- User-directed refinement: replaced the generic city illustration with a new District 1 map composition while preserving the same page-integrated treatment.

1. Initial implementation placed the map inside a rounded, tinted frame. This was a P1 visual mismatch because it looked like a pasted image.
2. Fixed by removing the frame, using a transparent page-level treatment, applying `mix-blend-mode: multiply`, and fading the illustration vertically.
3. User feedback confirmed it still read as an image, so the artwork was moved into an absolute background layer behind the hero content and its opacity was reduced.
4. A later pass found a P1 asset-treatment mismatch: the PNG's opaque cream canvas tinted the entire rectangular image slot, while the reference keeps the left surface clean and shows only the right-side illustration.
5. Fixed by extracting the canvas into transparency, restoring a clear right-side map, preserving the original aspect ratio with `object-contain`, and fading only the illustration toward the left.
6. The post-fix combined comparison shows no actionable P0, P1, or P2 mismatch.

## Verification

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm build` — passed.
- Browser desktop capture — passed.
- Browser mobile capture — passed.

final result: passed
