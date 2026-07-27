---
name: add-prisma-model
description: "Add or modify a model in the PostgreSQL Prisma schema for the RoomRent backend. Use this skill whenever Codex creates a table or model; adds or changes a field, enum, index, or relation; or needs to persist new data. Enforce soft-delete and index conventions, create migrations correctly, and never edit an applied migration."
---

# Adding / modifying a Prisma model

## Non-negotiable principles

- **Never edit an already-applied migration.** After changing the schema, always generate a new migration via the CLI — never hand-write `.sql` files under `prisma/migrations/`.
- **No RLS** — access control is checked at the service layer (Nest), not at the DB.
- Records that can be "deleted" → add `deletedAt DateTime?`, never hard-delete.
- User = a self-managed `User` model (no more Supabase `auth.users`) — has `passwordHash`, `role`.

## Workflow

### 1. Check the current state
Read `prisma/schema.prisma` to see which models/enums/fields already exist, to avoid duplicates or names that break convention.

### 2. Edit `schema.prisma` following the standard template

```prisma
enum RoomType {
  boarding_house
  whole_house
  mini_apartment
  serviced_apartment
  shared_room
}

enum RoomStatus {
  draft
  pending
  active
  hidden
  rejected
  expired
}

model Room {
  id          Int        @id @default(autoincrement())
  ownerId     String     @map("owner_id")
  owner       User       @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  title       String
  slug        String     @unique
  description String?
  roomType    RoomType   @default(boarding_house) @map("room_type")

  price       Int
  area        Float?
  deposit     Int?

  city        String
  district    String
  ward        String?
  address     String?
  latitude    Float?
  longitude   Float?

  isVerified  Boolean    @default(false) @map("is_verified")
  status      RoomStatus @default(pending)

  viewCount    Int       @default(0) @map("view_count")
  contactCount Int       @default(0) @map("contact_count")

  publishedAt DateTime?  @map("published_at")
  deletedAt   DateTime?  @map("deleted_at")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  images      RoomImage[]

  @@index([status])
  @@index([city, district])
  @@index([price])
  @@map("rooms")
}
```

> `RoomType` values stay in English snake_case (`boarding_house`, `whole_house`...) — they are shared verbatim with the frontend, so don't rename them casually.

### 3. Naming conventions
- Model: singular PascalCase (`Room`, `RoomImage`, `SavedSearch`).
- Field in code: camelCase; DB column: snake_case via `@map("...")`.
- DB table: plural snake_case via `@@map("...")` (`rooms`, `room_images`).
- Foreign key: `<name>Id` (`ownerId`, `roomId`).
- Enum values: English snake_case, matching the original backend spec (`boarding_house`) — don't change arbitrarily since the frontend relies on these exact values.

### 4. Create a migration
```bash
npx prisma migrate dev --name add_room_verification_fields
```
Don't run `prisma db push` against an environment with real data (only for local prototyping).

### 5. When PostGIS is needed (`geography` column)
Prisma can't map the `geography` type — after migrating, add raw SQL to **the migration file that was just generated** (Prisma allows editing a *newly generated* migration before it's committed, unlike editing an old migration already applied to production):
```sql
-- Append to the end of the newly generated migration file
ALTER TABLE rooms ADD COLUMN geog geography(Point, 4326);
CREATE INDEX idx_rooms_geog ON rooms USING gist (geog);

CREATE OR REPLACE FUNCTION sync_room_geog() RETURNS trigger AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geog = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rooms_geog BEFORE INSERT OR UPDATE OF latitude, longitude ON rooms
FOR EACH ROW EXECUTE FUNCTION sync_room_geog();
```
Query this column from the service using `prisma.$queryRaw` (see the `build-room-search-api` skill).

### 6. After migrating
- Prisma Client regenerates types automatically — no manual step needed like with Supabase.
- Check whether related `RoomsService`/DTOs need updating for the new field.

## Checklist
- [ ] New model has `createdAt`, `updatedAt` (`@updatedAt`)
- [ ] Has `deletedAt DateTime?` if the record can be "deleted"
- [ ] Field/column names follow convention (camelCase in code, snake_case in DB via `@map`)
- [ ] Index on fields commonly filtered/joined (`@@index`)
- [ ] Migration created via CLI, never editing an old migration
- [ ] If using geography: PostGIS SQL added to the new migration, with trigger + GiST index
