---
name: test-backend-feature
description: "Add or update focused Jest tests for RoomRent NestJS services, controllers, guards, DTO validation, Prisma behavior, authentication, Cloudinary uploads, BullMQ processors, scheduled jobs, and API e2e flows. Use when Codex implements a backend feature, fixes a regression, changes authorization or state transitions, modifies database behavior, or needs to verify failure handling under server/."
---

# Test a backend feature

Test business rules and security boundaries, not framework internals.

## Inspect the test setup

1. Read `server/AGENTS.md`, the changed code, and adjacent tests.
2. Inspect `package.json`, the inline Jest configuration, and `test/jest-e2e.json`.
3. Keep unit specs beside source as `*.spec.ts`.
4. Keep e2e specs under `test/`.
5. Use the existing Jest, Nest testing utilities, and Supertest stack.
6. Do not contact live PostgreSQL, Redis, Cloudinary, Google, SMS, or external APIs from unit tests.

## Choose coverage

| Change | Preferred test |
|---|---|
| Pure helper, DTO transform, or validation | Unit test |
| Service business rule or ownership check | Service unit test |
| Guard, decorator, or filter | Focused unit test |
| Controller wiring and delegation | Controller unit test only when it adds value |
| ValidationPipe, guards, cookies, serialization, or HTTP contract | E2E test |
| Prisma transaction or complex query | Unit test plus integration/e2e when database semantics matter |
| BullMQ processor or cron logic | Processor/service unit test with mocked queue and Prisma |
| Auth, moderation, search, or contact disclosure | Unit tests plus key e2e paths |

Avoid reproducing NestJS behavior in low-value controller tests.

## Build a testing module

- Register only the controller or service under test.
- Provide typed mocks for `PrismaService`, queues, token services, Cloudinary, and other dependencies.
- Reset mocks before every test.
- Avoid one shared mutable fixture across test cases.
- Use realistic enum values from the generated Prisma client.
- Freeze time when asserting expiry, publication, moderation, OTP, or token behavior.

Prefer small mock factories that expose only methods used by the subject. Do not hide assertions behind an oversized generic mock framework.

## Service tests

Cover:

- Successful behavior and returned safe shape.
- Missing resources.
- Invalid state transitions.
- Ownership and role failures.
- Soft-deleted resources.
- Prisma failures only where the service translates or reacts to them.
- Transaction contents and ordering when atomicity is a business requirement.
- Side effects such as session revocation, contact logging, audit creation, or queue enqueueing.

Assert that secret fields are omitted from selects and results.

## Authorization matrix

For protected behavior, cover the relevant matrix:

| Caller | Expected result |
|---|---|
| Unauthenticated | 401 |
| Authenticated wrong role | 403 |
| Correct role but not owner | 403 or policy-approved 404 |
| Owner | Allowed owner operation |
| Administrator | Allowed only where policy grants it |
| Soft-deleted or banned user | Rejected |

Do not test only the success path for mutations.

## DTO and HTTP tests

- Exercise global whitelist, `forbidNonWhitelisted`, and transform behavior.
- Cover missing, malformed, boundary, and extra fields.
- Assert HTTP status, safe error shape, and important response fields.
- Verify Swagger-facing behavior matches the implemented contract.
- Do not make tests depend on volatile timestamps unless time is frozen.

## Authentication

- Never use real secrets or tokens in fixtures.
- Cover password hash comparison without logging raw credentials.
- Cover access and refresh secrets separately.
- Cover refresh-cookie flags, rotation or revocation, token-version checks, logout, password change, and banned-user rejection.
- Assert no response leaks `passwordHash`, OTP hashes, refresh tokens, or internal exceptions.

## Prisma and transactions

- Assert critical `where`, `select`, and `data` clauses.
- Verify public queries include `status: active` and `deletedAt: null`.
- Verify mutation queries scope ownership before update or deletion.
- For `$transaction([...])`, assert every atomic write is included.
- Do not claim a mocked transaction proves real database isolation, constraints, raw SQL, or PostGIS behavior; add an integration test when those semantics matter.

## Queues and external services

- Mock `Queue.add` and assert job name, minimal payload, retries, and backoff.
- Test processor idempotency and duplicate-log behavior.
- Test that one recipient failure does not fail unrelated recipients when policy requires isolation.
- Test expected best-effort behavior explicitly; do not silently swallow all failures.
- Mock Cloudinary signatures and confirm ownership, folder, expiry inputs, and persisted metadata.

## Commands

Run the narrowest relevant test:

```powershell
pnpm test -- --runInBand <pattern>
pnpm test:e2e -- --runInBand
```

Then run lint and build when warranted:

```powershell
pnpm lint
pnpm build
```

Remember that the lint script applies fixes. Inspect resulting changes and report any check that cannot run.
