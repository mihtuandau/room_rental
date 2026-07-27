# RoomRent frontend instructions

## Scope

These instructions apply to everything under `client/`.

The frontend is a separate Next.js application. It communicates with `server/` only through HTTP APIs and must never access Prisma, PostgreSQL, or backend source code directly.

## Codex skills

Load every applicable skill under `.agents/skills/` before editing:

- `bootstrap-frontend-setup`: providers, API clients, auth state, shared constants, and foundational setup
- `create-page-with-seo`: App Router pages, public metadata, JSON-LD, sitemap, and protected screens
- `add-react-query-hook`: Client Component queries, mutations, query keys, and invalidation
- `add-zustand-store`: browser-owned state that does not belong in the URL or API cache
- `add-bff-proxy-route`: authentication route handlers and authenticated API proxying
- `add-ui-component`: shared Radix and Tailwind interface primitives
- `add-form`: React Hook Form, Zod, mutations, and field-level backend errors
- `upload-image-cloudinary`: signed direct image uploads
- `build-map-search-experience`: MapLibre maps, markers, location search, coordinates, and map/list synchronization
- `sync-api-contract`: endpoint, DTO, Swagger/OpenAPI, frontend type, schema, BFF, and query-contract changes
- `test-frontend-feature`: focused unit, component, route-handler, integration, or e2e coverage
- `design-system`: styling, visual tokens, responsive behavior, motion, and accessibility
- `ui-state-patterns`: loading, empty, error, denied, pending, skeleton, and pagination states
- `vietnamese-ux-writing`: any user-facing Vietnamese text or metadata

Combine skills when a task crosses concerns. For example, a data-backed public form page normally requires page/SEO, form, React Query, UI-state, design-system, and Vietnamese-writing guidance.

## Fixed stack

- Next.js App Router
- React with strict TypeScript
- Tailwind CSS
- Radix UI primitives wrapped by shared components
- TanStack React Query for server state
- Zustand for browser-owned UI state only
- React Hook Form and Zod for forms
- `nuqs` for URL search parameters
- Cloudinary direct signed uploads

Do not introduce another library when the existing stack already covers the requirement.

## Commands

Run commands from `client/`.

```powershell
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

The development server uses port `5000`.

Run `lint` and `typecheck` for normal source changes. Run `build` for routing, rendering, configuration, dependency, or production-risk changes.

## Architecture

- Use Server Components by default.
- Add `"use client"` only when browser APIs, event handlers, React state, or client-side hooks require it.
- Keep reusable UI primitives in `src/components/ui/`.
- Keep domain components in a relevant folder such as `components/rooms/`, `components/search/`, or a feature-local component folder.
- Group feature API functions, hooks, and schemas under `src/features/<feature>/`.
- Keep plain HTTP functions in `api.ts` and React Query wrappers in `hooks.ts`.
- Keep shared constants and enum-to-label mappings centralized. Do not repeat domain labels in components.
- Keep controllers, Prisma types, and other backend internals out of frontend imports.

## Server and client data

- Fetch public SEO-critical data in Server Components when practical.
- Use React Query for backend data used by Client Components.
- Do not implement server fetching with hand-written `useEffect` and `useState`.
- Use Zustand only for state that has no server source of truth, such as open dialogs, draft filters, multi-step form position, or guest-only temporary selections.
- Never copy room lists, user profiles, notifications, or other API-owned data into Zustand.
- Use stable, feature-scoped React Query keys.
- Invalidate every affected query after a successful mutation.
- Put shareable search and filter state in the URL with `nuqs`.

## Authentication and BFF

- Authenticated Client Components call the NestJS API through Next.js route handlers.
- Keep access and refresh tokens out of browser-readable storage.
- Never store authentication tokens in `localStorage` or regular JavaScript-readable cookies.
- Use secure `httpOnly` cookies for session material.
- Keep browser-side API calls on same-origin `/api/...` routes where authentication is required.
- Handle expired access tokens through the established refresh flow.
- Clear session cookies during logout.
- Do not expose backend hostnames or secrets through public environment variables.

## Forms and validation

- Build forms with React Hook Form and Zod.
- Mirror relevant backend constraints in the frontend schema for user experience, while treating backend validation as authoritative.
- Connect submit behavior through a React Query mutation.
- Map backend validation failures to the appropriate fields.
- Handle backend `message` values that may be a string or an array.
- Never display raw backend or infrastructure errors to users.
- Disable duplicate submission while a mutation is pending.
- Preserve accessible labels, descriptions, keyboard behavior, and focus management.

## Data-driven UI states

Every data-driven screen must handle:

1. Loading
2. Empty
3. Error
4. Permission denied

Use skeletons shaped like the final layout. Avoid showing a spinner on an otherwise blank screen. Empty and error states should explain the situation and provide the next useful action.

## Design system

- Reuse established color, typography, spacing, radius, shadow, and motion tokens.
- Do not add raw hexadecimal colors when a semantic token exists.
- Avoid arbitrary one-off dimensions such as `mt-[13px]` when the spacing scale covers the need.
- Extend a shared token or component when a genuinely reusable value is missing.
- Wrap reusable Radix primitives once in `src/components/ui/`.
- Do not duplicate bespoke button, input, dialog, select, checkbox, badge, or state styling across pages.
- Preserve responsive behavior and verify mobile layouts.
- Respect reduced-motion preferences for non-essential animation.

## Vietnamese UX writing

- Write all user-facing interface text in Vietnamese.
- Use sentence case rather than title case.
- Address the user consistently as “bạn”.
- Use one canonical term for each domain concept.
- Use “tin đăng” consistently for room listings.
- Keep routes, file names, source identifiers, and API values in English.
- Translate developer-facing backend errors into helpful user-facing messages.
- Format VND through shared helpers and keep amounts as integers.
- Keep `RoomType` API values mapped to Vietnamese labels in one shared module.

## SEO and routing

- Use slugs for public detail routes.
- Avoid public detail URLs based on `?id=`.
- Export metadata for public SEO-relevant pages.
- Include canonical URLs and OpenGraph data.
- Add JSON-LD to listing detail pages where applicable.
- Generate sitemap entries from active public listings.
- Keep route names in English while allowing Vietnamese place-name slugs such as `quan-7`.
- Avoid making an entire public page a Client Component solely for a small interactive section.

## Image uploads

Use the signed direct-upload flow:

1. Request signed parameters from the backend.
2. Upload image bytes directly from the browser to Cloudinary.
3. Send the resulting `public_id` and secure URL to the backend for confirmation.

Do not proxy image bytes through Next.js or NestJS. Validate type, size, count, preview state, retry behavior, and removal behavior in the UI.

## API changes

Before calling a new or changed endpoint:

1. Inspect the current backend response contract or generated API types.
2. Update frontend Zod schemas and TypeScript types.
3. Add or update the plain API function.
4. Add or update the React Query hook.
5. Handle loading, empty, error, denied, and mutation states.
6. Verify authentication uses the correct BFF route.
7. Run lint, typecheck, and any broader check warranted by the change.
