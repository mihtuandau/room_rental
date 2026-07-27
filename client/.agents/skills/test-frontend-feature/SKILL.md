---
name: test-frontend-feature
description: "Add or update focused tests for RoomRent frontend components, forms, React Query hooks, Zustand stores, Next.js route handlers, authentication behavior, and critical browser flows. Use when Codex implements a frontend feature, fixes a regression, changes validation or state behavior, or introduces a test framework under client/. Select the smallest useful test layer and verify user-visible behavior instead of implementation details."
---

# Test a frontend feature

Test the behavior most likely to regress at the lowest layer that provides confidence.

## Start with the repository

1. Read `client/AGENTS.md`, the changed source, and adjacent tests.
2. Inspect `package.json` before choosing commands or imports.
3. If no frontend test stack exists, do not pretend tests ran. For a request that includes test setup, prefer:
   - Vitest and jsdom for the runner and DOM environment
   - React Testing Library and `@testing-library/user-event` for components
   - MSW for HTTP-bound integration behavior
   - Playwright for a small set of critical browser journeys
4. Add dependencies and configuration only when test infrastructure is part of the requested scope.
5. Keep lint, typecheck, and build as verification, not substitutes for behavioral tests.

## Choose the test layer

| Change | Preferred coverage |
|---|---|
| Pure formatter, query builder, parser, or Zod schema | Unit test |
| Zustand action or selector | Store unit test |
| Form validation and submission | Component test with user interactions |
| React Query hook or cache invalidation | Hook/component integration test with a fresh QueryClient |
| Shared UI component | Accessible component behavior test |
| BFF or auth route handler | Route-handler test with mocked backend fetch and cookie assertions |
| Server Component data composition | Extract and test pure logic; add integration coverage where practical |
| Login, search, listing creation, or upload journey | Playwright e2e test |

Avoid using an e2e test for logic a small deterministic test can cover.

## Test behavior, not structure

- Query elements by role, label, placeholder, or visible Vietnamese text.
- Assert what users can see, do, and recover from.
- Avoid snapshots for large page trees.
- Avoid assertions on class names unless the class itself is the behavior under test.
- Control time, randomness, network responses, and browser APIs explicitly.
- Never call the live backend, Google OAuth, Cloudinary, OpenStreetMap tiles, or geolocation from unit tests.

## React Query

- Create a new QueryClient for every test.
- Disable retries unless retry behavior is the subject of the test.
- Render with the same provider shape used by the application.
- Mock at the HTTP boundary or plain `api.ts` function boundary.
- Cover loading, success, empty, error, 401/403, mutation pending, and invalidation when relevant.
- Assert query keys and invalidated data through observable behavior rather than private cache internals where possible.

## Forms

- Exercise inputs with `userEvent`; do not call component handlers directly.
- Cover client validation, a successful mutation, backend field errors, generic failures, and duplicate-submit prevention.
- Assert that the submitted object uses parsed numeric values and omits empty optional values when required.
- Keep Vietnamese copy assertions aligned with `vietnamese-ux-writing`.

## Authentication and BFF routes

- Mock backend `fetch` responses, including `Set-Cookie`.
- Assert `rr_session` and `rr_refresh` flags, paths, expiry, and clearing behavior.
- Assert refresh and logout forward the refresh token as a backend `Cookie` header.
- Assert the catch-all proxy reads `rr_session` and adds the bearer header server-side.
- Assert failed refresh clears unusable cookies.
- Never place real tokens or credentials in fixtures.

## Map and upload boundaries

- Mock `maplibre-gl` and verify lifecycle inputs; do not render real tiles in jsdom.
- Test coordinate ordering as `[longitude, latitude]`.
- Mock direct Cloudinary uploads and assert that app credentials are not attached.
- Cover cancellation, retry, file rejection, confirmation failure, and partial upload state when applicable.

## E2E discipline

- Keep e2e tests few and high-value.
- Use isolated test accounts and deterministic seeded data.
- Prefer stable roles and labels over CSS selectors.
- Avoid fixed sleeps; wait for observable UI or network state.
- Capture traces or screenshots on failure through runner configuration.

## Verification

Run the narrowest relevant test command, then:

```powershell
pnpm lint
pnpm typecheck
```

Run `pnpm build` for routing, Server Component, configuration, or production-bundle risk. Report commands that do not exist or cannot run.
