---
name: roomrent-backend
description: "Apply the RoomRent backend architecture, security rules, data conventions, and implementation workflow to NestJS, Prisma, PostgreSQL, authentication, room search, uploads, queues, tests, and API changes under server/. Use this skill for any RoomRent backend task or whenever Codex modifies server/src, server/prisma, server/test, backend configuration, or backend dependencies."
---

# RoomRent backend

Apply the project-wide backend contract before making a task-specific change.

## Workflow

1. Read [references/project-rules.md](references/project-rules.md) completely before changing backend code.
2. Inspect the current implementation, Prisma schema, migrations, tests, and package scripts relevant to the request. Treat the repository as the source of truth when it differs from an outdated example.
3. Load the applicable specialized skill:
   - API controller, service, DTO, or Nest module: `add-nest-module`
   - Prisma model, field, enum, relation, index, or migration: `add-prisma-model`
   - Register, login, logout, refresh, password reset, or OTP: `auth-jwt-refresh-otp`
   - Application bootstrap, environment validation, Prisma module, or global filters: `bootstrap-project-setup`
   - Room filtering, sorting, ranking, text search, or radius search: `build-room-search-api`
   - Signed Cloudinary uploads or stored image metadata: `cloudinary-upload`
   - Saved-search notifications, queues, cron, or background work: `saved-search-notification-job`
   - Backend unit, integration, processor, guard, or e2e tests: `test-backend-feature`
   - Security review of a backend change: `audit-backend-security`
   - Listing moderation, reports, bans, verification, or admin audit trails: `build-admin-moderation-flow`
   - Prisma CLI or Prisma 7-specific work: use the matching `prisma-*` skill already installed under `.agents/skills`
4. Combine specialized skills when the change crosses boundaries. Keep the project-wide security rules authoritative.
5. Implement only the requested scope. Preserve existing user changes and avoid unrelated refactors.
6. Verify proportionally with lint, typecheck/build, unit tests, e2e tests, Prisma validation, or migration checks as applicable. Report any check that could not run.

## Non-negotiable checks

- Enforce authorization in Nest guards and services; do not rely on database RLS.
- Validate every request input and keep controllers thin.
- Never expose password hashes, OTP hashes, secrets, raw database errors, or stack traces.
- Enforce ownership or admin authorization before mutations.
- Preserve soft-delete, moderation audit, verified-first ranking, and contact-log requirements.
- Use parameterized Prisma raw queries only where Prisma Client cannot express the operation.
- Update Swagger metadata and tests with API behavior.
- Never edit an applied migration.
