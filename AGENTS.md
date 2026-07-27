# RoomRent monorepo instructions

## Scope

These instructions apply to the entire repository.

- `client/` is the Next.js frontend. Follow `client/AGENTS.md` for all work in that directory.
- `server/` is the NestJS and Prisma backend. Follow `server/AGENTS.md` for all work in that directory.
- A nested `AGENTS.md` adds to and overrides this file within its directory.

## Product

RoomRent is a Vietnamese room-rental discovery platform for tenants, landlords, and administrators.

Core flow:

1. A landlord submits a room listing with `pending` status.
2. An administrator reviews it and changes it to `active` or `rejected`.
3. Tenants search, filter, save, and contact landlords.

Prioritize verified listings and anti-fraud controls. Do not add online payments, deposits, realtime chat, e-contracts, or AI recommendations unless explicitly requested.

## Application boundary

- The frontend and backend communicate only through HTTP APIs.
- Frontend code must never access the database, Prisma, or backend internals.
- Backend code must not depend on frontend implementation details.
- Define or inspect the API contract before implementing a change that crosses both applications.
- Preserve the Next.js BFF boundary for authenticated requests originating in Client Components.

## Working rules

1. Inspect the current code, schema, migrations, tests, and package scripts before editing.
2. Treat the repository as the source of truth when documentation or examples are stale.
3. Keep changes within the requested scope and preserve unrelated user changes.
4. Do not add dependencies unless the existing stack cannot reasonably solve the problem.
5. Never commit secrets or real `.env` files. Keep sanitized `.env.example` files.
6. Exclude generated build output, dependency directories, and local tool settings.
7. Use Conventional Commit prefixes when asked to commit: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, or `test:`.
8. Run the narrowest relevant verification first, followed by broader checks when risk warrants them.

## Cross-application workflow

When a feature changes both applications:

1. Inspect or define the backend contract.
2. Implement backend validation, authorization, behavior, documentation, and tests.
3. Update frontend schemas, API functions, hooks, forms, and UI states to match.
4. Verify each application using the commands in its own `AGENTS.md`.
5. Report any check that could not run.
