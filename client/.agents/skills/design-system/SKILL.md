---
name: design-system
description: "Apply the RoomRent visual system. Use for colors, typography, spacing, radius, shadows, motion, responsive design, and accessibility."
---

# RoomRent design system

One rule underpins all of this: **never invent a value at the call site.** If a colour,
size or spacing you need isn't here, add it here first, then use it. That is the whole
difference between a UI that looks designed and one that looks assembled.

## Brand direction

The product's promise is **trustworthy listings** in a market full of fake ones. The
visual language should read calm, clean and credible — not loud marketplace energy.
Competitors lean on orange/red urgency; RoomRent uses a deliberate green as the trust
signal, and keeps everything else quiet so verified badges and photos stand out.

## Tokens (Tailwind v4 `@theme`)

`src/app/globals.css`
```css
@import "tailwindcss";

@theme {
  /* Brand — used for primary actions and the verified signal */
  --color-brand-50:  oklch(0.97 0.02 165);
  --color-brand-100: oklch(0.94 0.04 165);
  --color-brand-500: oklch(0.70 0.13 165);
  --color-brand-600: oklch(0.60 0.13 165);   /* default: buttons, links */
  --color-brand-700: oklch(0.51 0.12 165);   /* hover */
  --color-brand-900: oklch(0.33 0.08 165);

  /* Status — meaning, not decoration */
  --color-success-50:  oklch(0.97 0.03 150);
  --color-success-600: oklch(0.60 0.14 150);
  --color-warning-50:  oklch(0.97 0.04 85);
  --color-warning-600: oklch(0.68 0.15 85);   /* pending moderation */
  --color-danger-50:   oklch(0.97 0.03 25);
  --color-danger-600:  oklch(0.58 0.20 25);   /* destructive, rejected */

  /* Typography — one family, no display font */
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;

  /* Radius — three steps only */
  --radius-md: 0.5rem;    /* inputs, buttons */
  --radius-lg: 0.75rem;   /* cards, dialogs */
  --radius-full: 9999px;  /* pills, avatars */

  /* Elevation — flat by default; shadow means "floating above the page" */
  --shadow-card: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-popover: 0 10px 25px -5px rgb(0 0 0 / 0.12);

  /* Motion — fast enough to feel instant */
  --ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Zinc (Tailwind's built-in) is the neutral ramp — no custom greys.

## Colour rules

| Use | Token |
|---|---|
| Primary action, active state, link | `brand-600`, hover `brand-700` |
| Verified badge | `brand-600` on `brand-50` |
| Pending / awaiting moderation | `warning-600` on `warning-50` |
| Rejected, destructive action, error text | `danger-600` on `danger-50` |
| Body text | `zinc-900` · Secondary text `zinc-600` · Muted/meta `zinc-500` |
| Border | `zinc-200` · Divider `zinc-100` · Page background `white` or `zinc-50` |

- **Colour never carries meaning alone.** A verified badge needs its icon and the word
  "Đã xác minh", not just green — colour-blind users and greyscale printouts must still work.
- Don't use `brand-*` for decoration. If everything is green, nothing reads as important.
- Price is `zinc-900` and bold, not brand-coloured — it's information, not an action.

## Typography scale

Only these steps. Anything else is drift.

| Role | Classes |
|---|---|
| Page title (h1) | `text-2xl font-semibold tracking-tight` (`sm:text-3xl`) |
| Section title (h2) | `text-lg font-semibold` |
| Card title | `text-base font-medium` |
| Body | `text-sm` (`text-base` for long-form description) |
| Meta / caption | `text-xs text-zinc-500` |
| Price on a card | `text-base font-semibold` · on detail `text-2xl font-bold` |

- Line length caps at `max-w-prose` for descriptions — full-width paragraphs are unreadable.
- One weight jump at a time: `font-normal` → `font-medium` → `font-semibold`. Skip `font-bold`
  except for the detail-page price.

## Spacing

Stick to the 4px scale, and prefer these specific steps so rhythm stays predictable:

| Context | Value |
|---|---|
| Inside a control (icon↔label) | `gap-2` |
| Between form fields | `space-y-4` |
| Card padding | `p-4` (`sm:p-5`) |
| Between sections on a page | `space-y-8` (`sm:space-y-12`) |
| Page container | `mx-auto max-w-6xl px-4 sm:px-6` |

Grids use `gap-4`. Detail-page two-column layout: `lg:grid-cols-[1fr_360px] gap-8`.

## Elevation and borders

Default to a **border, not a shadow**. Cards in a list use `border border-zinc-200
rounded-lg` with no shadow; hover may add `shadow-card`. Reserve `shadow-popover` for
things genuinely floating: dialogs, dropdowns, popovers, sticky filter bars.

Never stack a heavy border and a heavy shadow on the same element — pick one.

## Motion

- Duration `150ms` for hover/colour, `200ms` for enter/exit.
- Only animate `opacity` and `transform`; animating layout properties causes jank.
- Respect the user: wrap non-essential motion in `motion-safe:` or honour
  `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Responsive

Mobile-first — most Vietnamese rental traffic is on phones. Write the mobile styles
first, then add `sm:` / `lg:`.

- Listing grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Filters: a bottom sheet on mobile, a sidebar from `lg:`
- Tap targets: minimum `h-10` (40px); icon-only buttons `h-10 w-10`

## Accessibility floor

- Text contrast ≥ 4.5:1. `brand-600` on white passes; `brand-500` on white does not — don't use it for text.
- Never remove the focus ring. Use `focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2`.
- Every image has `alt`. Room photos: `alt={room.title}`; decorative images: `alt=""`.
- Icon-only buttons need `aria-label`.

## Dark mode

**Out of scope for the MVP.** Don't add `dark:` variants — a half-supported dark mode
looks worse than none. If it's added later it will be a deliberate pass over the token
list, not scattered variants.

## Do NOT
- Write a raw hex/`rgb()` in a component — use a token.
- Introduce a font size, radius, or shadow that isn't listed above.
- Use `brand-*` as decoration or for body text.
- Convey status with colour alone.
- Add `dark:` variants.
- Use `!important` to win a specificity fight — fix the class order instead.

## Checklist
- [ ] Every colour comes from a token
- [ ] Text size is one of the scale steps
- [ ] Spacing uses the listed steps
- [ ] Border **or** shadow, not both
- [ ] Focus-visible ring present on every interactive element
- [ ] Status communicated by icon/text as well as colour
- [ ] Mobile layout written first
