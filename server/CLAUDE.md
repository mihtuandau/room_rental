# RoomRent BACKEND — Project Rules

> Applies to the Backend (API) repo. Place this file at the repo root as `CLAUDE.md`.
> The Frontend repo is a **separate project** with its own `CLAUDE.md` — the two only talk to each other over the HTTP API.
> The "🚫 HARD RULES" section is mandatory and must never be violated, even if a prompt asks for it.

---

## 1. Product

API for a room-rental discovery platform (MVP). Serves 3 client roles: tenant, landlord, admin.
Main flow: landlord posts a room (pending) → admin approves (active) → tenant searches/filters/contacts.
USP: **verified listings** (phone/identity/location) + anti-fake-listing measures.

MVP **does NOT include**: online payments, online deposits, realtime chat, e-contracts, AI recommendations.

---

## 2. Tech stack (fixed)

- **Framework**: NestJS (TypeScript strict)
- **ORM**: Prisma + PostgreSQL (extensions `postgis`, `unaccent`)
- **Auth**: JWT (short-lived access token + refresh token), Passport (`@nestjs/passport`, `passport-jwt`), bcrypt/argon2 for password hashing
- **Validation**: `class-validator` + `class-transformer` on DTOs
- **API docs**: `@nestjs/swagger` — every endpoint must have descriptive decorators
- **Rate limiting**: `@nestjs/throttler`
- **Jobs/queues** (as needed): BullMQ + Redis (used for scanning `saved_searches` to send notifications)
- **File upload**: Cloudinary signed upload — the client uploads directly to Cloudinary, Nest does not hold files long-term
- **Testing**: Jest (unit tests for services, e2e for key controllers: auth, room CRUD, search)

Don't add new libraries without a clear reason.

---

## 3. 🚫 HARD RULES (security — must never be violated)

1. **No RLS at the DB layer.** All authorization lives at the **application layer**: JWT auth Guard + Service checks `ownerId === currentUser.id` (or admin role) before every update/delete.
2. **Passwords**: store only the hash (bcrypt cost ≥ 12 or argon2). Never return `passwordHash` in a response (use `class-transformer`'s `@Exclude()` or explicit field selection). The same rule applies to OTP codes — store only `codeHash`, never the raw code, and never log it in production.
3. **JWT**: access token is short-lived (15–30 minutes), refresh token stored in an **httpOnly cookie**, with a revocation mechanism (a `refresh_tokens` table or a token version on `User`). Never let the frontend store the access token in localStorage if it can be avoided — prefer cookies.
4. **CORS**: whitelist only the real frontend domain (env var `FRONTEND_URL`), `credentials: true`. Never use `origin: '*'` when cookies are involved.
5. **Validate every input** with a DTO + `class-validator`. Enable global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — automatically blocks unexpected fields.
6. **Never return raw DB errors** (stack traces, SQL) to the client. Use `HttpException` with a friendly message; log details server-side (Logger/Sentry).
7. **Soft delete**: records that can be "deleted" use a `deletedAt` column. Public list queries always exclude `deletedAt: null`... i.e. filter it out. Hard-deleting a `User` is never allowed — relations that must survive it (`Room.owner`, `ContactLog.user`, `Report.reporter`, `RoomModeration.admin`) use `onDelete: Restrict` at the DB level as a safety net.
8. **Rate limit** sensitive endpoints: login, register, fetching a landlord's phone number, search (anti-scrape/brute-force).
9. **No hard-coded secrets.** Everything goes through `.env` (read via `@nestjs/config`, with schema validation via Joi/zod at app startup).
10. Log every view of a landlord's phone number into `ContactLog` — useful for landlord-facing stats and as anti-abuse data.

---

## 4. Directory structure

```
src/
├── main.ts                    # bootstrap, ValidationPipe, CORS, Swagger
├── app.module.ts
├── common/
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── decorators/            # @CurrentUser(), @Roles()
│   ├── filters/                # HttpExceptionFilter (standardizes error responses)
│   └── interceptors/          # logging, transform response
├── config/                    # read + validate env variables
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts       # Global module
├── modules/
│   ├── auth/                  # register, login, refresh, OTP
│   ├── users/                 # profile
│   ├── rooms/                 # room CRUD, search
│   │   ├── dto/
│   │   ├── rooms.controller.ts
│   │   ├── rooms.service.ts
│   │   └── rooms.module.ts
│   ├── favorites/
│   ├── saved-searches/
│   ├── amenities/              # amenity catalog + room-amenity assignment
│   ├── contact-logs/
│   ├── room-views/             # optional view analytics, rate-limited/deduped
│   ├── reports/
│   ├── storage/                # Cloudinary signed upload
│   ├── notifications/          # BullMQ job: saved-search match notifications
│   └── admin/                  # approve listings, ban users, handle reports, RoomModeration audit log (RolesGuard admin)
prisma/
├── schema.prisma
└── migrations/                # versioned, do NOT hand-edit old migrations
```

- Each domain = its own Nest module (controller + service + dto + module).
- Services **do not** access `req`/`res` directly — they receive `userId`/`role` as parameters from the controller (extracted via `@CurrentUser()`).
- Don't hand-build SQL strings — use Prisma Client; only use `$queryRaw`/`$queryRawUnsafe` (safe, parameterized) for PostGIS queries.

---

## 5. Code conventions

- **DTO for every input**: `CreateRoomDto`, `UpdateRoomDto`, `SearchRoomsDto`... using `class-validator` decorators (`@IsString()`, `@IsInt()`, `@Min()`...).
- **Response DTO/serialization**: use `class-transformer` to avoid leaking internal fields (`passwordHash`, unnecessary `deletedAt`, etc.).
- **Enums**: defined in `schema.prisma`, reuse the enum generated by Prisma Client — don't manually redefine duplicate enums in DTOs if avoidable.
- Controllers stay thin — only receive the request, call the service, return the result. Business logic lives in the service.
- Every endpoint: attach `@ApiOperation`, `@ApiResponse` (Swagger) so the frontend can generate types.
- Return errors using standard NestJS exceptions: `NotFoundException`, `ForbiddenException`, `BadRequestException`... don't roll your own error format.

---

## 6. Data conventions (Vietnam-specific — kept from the original schema)

- Money: `Int` (VND), never float.
- Location: `city` / `district` / `ward` kept as separate fields (not merged into a single address string).
- Vietnamese text search: use the `unaccent` extension in raw queries when matching text.
- `RoomType` enum: `boarding_house | whole_house | mini_apartment | serviced_apartment | shared_room`.
- Coordinates: store `latitude`/`longitude` (Float) + a `geog` column of type `geography(Point,4326)` kept in sync via a DB trigger or recomputed in a migration — Prisma can't map this type, so it's handled via raw SQL.

---

## 7. Moderation & verification (USP)

- Newly created rooms default to `status: pending`. Only admin (`RolesGuard('admin')`) can change it to `active`/`rejected`.
- Public list/detail endpoints always filter `status: 'active', deletedAt: null`.
- Search results: `isVerified: true` ranks first (via `order by` in Prisma or raw SQL).
- Phone verification via OTP (`auth/otp` module) — do this in the MVP since it's cheap. eKYC comes later.
- Every admin status change on a `Room` (approve/reject/hide/restore) is recorded in `RoomModeration` — this is the audit trail for the admin dashboard, don't skip writing it.

---

## 8. When AI writes code, always:

1. Before touching the DB → check the current `prisma/schema.prisma`, use the exact model/field names.
2. Changing the schema → generate a migration with `npx prisma migrate dev --name <description>`, never hand-edit old migration files.
3. Every mutation endpoint → has DTO validation + auth Guard + ownership check in the service.
4. Every new module → registered in `app.module.ts`, with at least one service test.
5. Update Swagger decorators when adding/changing an endpoint so the frontend generates correct types.
6. Don't add features beyond the MVP (section 1) unless explicitly requested.

---

## 9. Git / commits

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
- Never commit `.env*`, `dist/`, `node_modules`.
- Migrations are code — commit them together with the schema change, don't split into separate commits.
