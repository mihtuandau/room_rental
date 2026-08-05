# Auth layout design QA

- Source visual truth: `C:\Users\TUAN\AppData\Local\Temp\codex-clipboard-74e1d77e-2ef1-497f-a14c-3297f160cb74.png` (login) and `C:\Users\TUAN\AppData\Local\Temp\codex-clipboard-c9a367ad-a1b6-468f-9412-aec270ed178f.png` (register).
- Implementation screenshots: `C:\Users\TUAN\.codex\visualizations\2026\07\27\019fa3e6-aaf0-7ba0-a310-0d45002570e6\auth-split-login.png`, `auth-split-register.png`, `auth-split-forgot.png`, and `auth-split-mobile.png`.
- Desktop viewport: 1280 × 720 CSS px, device scale factor 1.
- Mobile viewport check: 390 × 844 CSS px, device scale factor 1; card width remained within the viewport and the register form remained vertically scrollable.
- State: unauthenticated login, register, and forgot-password contact step.

## Comparison

- Full-view: desktop auth uses a two-panel shell with a RoomRent photo/brand panel and a bordered form card. Login places the brand panel left; register reverses it. Mobile collapses to one readable column.
- Focused regions: social row uses the supplied `logogoogle.webp` and `logofacebook.png` assets with provider labels; password fields retain the existing show/hide behavior; OTP and reset flows remain owned by the existing forms.
- Console: no browser errors observed on `/login` during the verification pass.

## Findings and fixes

- [P1] Previous auth screens used a separate logo header and a single narrow card. Fixed with a responsive split shell, brand photo panel, and centered form card.
- [P2] Login/register had different heading and footer placement. Fixed with matching page compositions and consistent spacing.
- [P2] Social assets were not represented in the compact row. Added the supplied assets; Google keeps the existing OAuth logic, while Facebook announces that the feature is still in development.
- [P2] Long register/reset states needed to remain usable on mobile. Verified the 390 × 844 viewport without horizontal overflow.

- [P2] Route changes previously exposed the panel swap as an abrupt replacement. The brand panel now uses a left-position sweep across the form, with a higher stacking layer so the image covers the form while crossing; forgot-password uses the same swapped state as register.

## Validation

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm build` — passed.
- Primary interactions checked: login fields, password visibility control, forgot-password link, register link, social row accessibility labels, and auth route rendering.

final result: passed
