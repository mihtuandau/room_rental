---
name: audit-backend-security
description: "Audit RoomRent NestJS and Prisma changes for authentication, authorization, ownership, role enforcement, mass assignment, validation, token and cookie security, rate limiting, secret or error leakage, raw SQL injection, upload abuse, queue trust boundaries, and public-data exposure. Use when Codex reviews or changes protected endpoints, auth, admin behavior, Prisma queries, uploads, contact disclosure, search, or other security-sensitive backend code."
---

# Audit backend security

Perform an evidence-based review. Report concrete findings with file and line references, impact, exploit path, and remediation. Do not modify code unless the user asks for fixes.

## Establish the boundary

1. Read `server/AGENTS.md` and the `roomrent-backend` project rules.
2. Trace the request from controller through guards, DTO, service, Prisma, side effects, and response.
3. Inspect the actual Prisma schema and generated enum usage.
4. Identify caller types, protected resources, trusted inputs, secrets, and external systems.
5. Review existing tests to determine which controls are enforced versus merely intended.

## Authentication

- Verify access and refresh tokens use different validated secrets.
- Verify access tokens are short-lived and refresh tokens are revocable.
- Verify refresh and logout read the protected cookie rather than accepting an untrusted body token.
- Verify secure, `httpOnly`, `sameSite`, path, domain, and production settings.
- Verify logout, password changes, bans, and other security events revoke existing sessions.
- Verify banned or soft-deleted users cannot authenticate or refresh.
- Verify Google tokens are validated for issuer, audience, expiry, and intended token type.
- Verify OTPs are hashed, expire, enforce attempt and resend limits, and never enter logs.

## Authorization and BOLA

For every protected endpoint:

- Confirm `JwtAuthGuard` is applied.
- Confirm `RolesGuard` and `@Roles()` are applied where role restriction is required.
- Confirm services receive the authenticated user ID rather than trusting an owner ID from the body.
- Confirm update, delete, contact, notification, saved-search, report, and upload operations scope the target to the caller.
- Confirm administrator exceptions are explicit.
- Confirm list endpoints cannot expose another user's resources through query parameters.
- Check predictable IDs for IDOR/BOLA even when the endpoint is authenticated.

Prefer a policy-consistent 404 when disclosing resource existence would be sensitive.

## Validation and mass assignment

- Require DTO validation for body, query, and route parameters.
- Confirm global whitelisting and `forbidNonWhitelisted`.
- Avoid spreading request bodies into Prisma writes.
- Map allowed fields explicitly.
- Prevent landlords from setting `ownerId`, `status`, `isVerified`, moderation fields, counts, publication timestamps, or soft-delete fields.
- Bound page sizes, numeric ranges, coordinate ranges, text lengths, and array sizes.
- Validate enum values with generated Prisma enums or a synchronized safe list.

## Prisma and data exposure

- Require `status: active` and `deletedAt: null` for public listing queries.
- Require `deletedAt: null` or equivalent policy checks for protected resources where appropriate.
- Inspect `select` and `include` clauses for `passwordHash`, OTP hashes, token versions, private phone numbers, internal notes, and moderation-only data.
- Preserve soft deletion and restrictive relations where audit history must survive.
- Check race-prone read-then-write flows and use transactions or conditional writes when state can change concurrently.
- Never edit an applied migration.

## Raw SQL and search

- Prefer Prisma Client.
- Use parameterized tagged-template raw queries for PostGIS or `unaccent`.
- Reject concatenated SQL, interpolated sort columns, and `$queryRawUnsafe` with untrusted data.
- Validate coordinates, radius, sort values, pagination, and filter sizes.
- Check public search for scraping controls and deterministic pagination.

## Errors, logs, and secrets

- Ensure the global exception filter returns only safe status, message, and timestamp fields.
- Never return stack traces, raw database errors, provider errors, secrets, hashes, or tokens.
- Ensure logs do not contain passwords, OTPs, tokens, cookie values, Cloudinary signatures, or full sensitive request bodies.
- Read secrets only from validated server configuration.
- Check Swagger examples and test fixtures for accidental real credentials.

## Abuse controls

- Rate-limit login, registration, OTP, password reset, search, contact reveal, reports, upload signatures, and other abuse-sensitive operations.
- Log landlord contact reveals with authenticated user and room context.
- Prevent duplicate reports and notification spam where policy requires it.
- Bound upload signature purpose, folder, resource ownership, expiry, file type, size, and count.
- Never allow the API server to become an unrestricted file proxy.

## Admin and moderation

- Require both authentication and admin role guards.
- Prevent self-ban and unauthorized modification of other administrators.
- Enforce explicit listing state transitions.
- Make status change and `RoomModeration` audit creation atomic.
- Preserve who acted, what happened, when, and the optional reason.
- Prevent ordinary room update endpoints from setting moderation fields.
- Revoke sessions immediately when a user is banned.

## Queues and jobs

- Treat job payloads as untrusted identifiers; reload authoritative records from the database.
- Verify room status and soft-delete state inside processors.
- Use idempotency constraints for retries.
- Avoid placing secrets or unnecessary personal data in queue payloads.
- Ensure one recipient failure does not corrupt or duplicate unrelated deliveries.
- Distinguish deliberate best-effort side effects from failures that must roll back the main operation.

## Finding severity

- Critical: direct account takeover, secret disclosure, arbitrary SQL, or broad authorization bypass.
- High: cross-user resource access, admin bypass, refresh-token compromise, or unrestricted upload.
- Medium: missing rate limit, limited sensitive-data exposure, race condition, or incomplete revocation.
- Low: defense-in-depth gap with limited exploitability.

If no issue is found, state what was reviewed and what remains unverified. Do not claim security based only on passing tests.
