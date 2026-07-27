---
name: build-room-search-api
description: Build or modify the room search endpoint in the RoomRent backend — filter by price/area/room type/amenities, search within a radius around a landmark/industrial-park using PostGIS via a Prisma raw query, ranking verified listings first. MUST use this skill whenever touching search/filter/sort or "find rooms near X" on the backend. Always ensures filtering to active listings only, verified-first ranking, and parameterized `$queryRaw` (never string-concatenated SQL).
---

# Room search API (NestJS + Prisma)

Search is the core feature. Since Prisma doesn't support PostGIS natively, radius search must use a raw query — SQL injection needs careful handling.

## Principles

- Always filter `status: 'active', deletedAt: null` on public endpoints.
- **Verified-first**: `isVerified` descending is always the first order condition.
- Regular filters (price, area, room type) → use the normal Prisma query builder.
- Radius filter (near a landmark) → use `prisma.$queryRaw` with a **tagged template** (auto-parameterized, injection-safe). **Never** use `$queryRawUnsafe` with hand-concatenated strings.
- DTO for query params uses `class-validator` + `Type()` transform (query strings are always strings and need type coercion).

## Template: search DTO

`src/modules/rooms/dto/search-rooms.dto.ts`
```ts
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { RoomType } from "@prisma/client";

export class SearchRoomsDto {
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsEnum(RoomType) roomType?: RoomType;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceMax?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) areaMin?: number;

  @IsOptional() @Type(() => Number) @IsInt() landmarkId?: number;
  @IsOptional() @Type(() => Number) @IsInt() radiusM?: number = 3000;

  @IsOptional() @IsEnum(["newest", "price_asc", "price_desc"])
  sort?: "newest" | "price_asc" | "price_desc" = "newest";

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number = 20;
}
```

## Template: basic search (non-geo) — Prisma query builder

```ts
async search(dto: SearchRoomsDto) {
  const { page = 1, pageSize = 20 } = dto;

  const where = {
    status: "active" as const,
    deletedAt: null,
    ...(dto.city && { city: dto.city }),
    ...(dto.district && { district: dto.district }),
    ...(dto.roomType && { roomType: dto.roomType }),
    ...(dto.priceMin && { price: { gte: dto.priceMin } }),
    ...(dto.priceMax && { price: { ...(dto.priceMin && { gte: dto.priceMin }), lte: dto.priceMax } }),
    ...(dto.areaMin && { area: { gte: dto.areaMin } }),
  };

  const orderBy = [
    { isVerified: "desc" as const },  // verified always comes first
    ...(dto.sort === "price_asc"  ? [{ price: "asc" as const }]  : []),
    ...(dto.sort === "price_desc" ? [{ price: "desc" as const }] : []),
    ...(dto.sort === "newest" || !dto.sort ? [{ createdAt: "desc" as const }] : []),
  ];

  const [rooms, total] = await this.prisma.$transaction([
    this.prisma.room.findMany({
      where, orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { images: { where: { isCover: true }, take: 1 } },
    }),
    this.prisma.room.count({ where }),
  ]);

  return { rooms, total, page, pageSize };
}
```

## Template: radius search around a landmark (safe PostGIS raw query)

```ts
async searchNearLandmark(landmarkId: number, radiusM = 3000, priceMax?: number) {
  // Prisma's tagged template auto-parameterizes — do NOT hand-concatenate strings
  const rooms = await this.prisma.$queryRaw<RoomRow[]>`
    SELECT r.id, r.title, r.slug, r.price, r.city, r.district, r.is_verified,
           ST_Distance(r.geog, l.geog) AS distance_m
    FROM rooms r
    JOIN landmarks l ON l.id = ${landmarkId}
    WHERE r.status = 'active'
      AND r.deleted_at IS NULL
      AND r.geog IS NOT NULL
      AND ST_DWithin(r.geog, l.geog, ${radiusM})
      ${priceMax ? Prisma.sql`AND r.price <= ${priceMax}` : Prisma.empty}
    ORDER BY r.is_verified DESC, distance_m ASC
    LIMIT 50;
  `;
  return rooms;
}
```
> Requires `import { Prisma } from "@prisma/client"` to use `Prisma.sql`/`Prisma.empty` when composing optional conditions — still parameterized, safety is preserved.

## Template: accent-insensitive Vietnamese text search (unaccent)

```ts
async searchByTitle(keyword: string) {
  return this.prisma.$queryRaw`
    SELECT id, title, slug, price, district
    FROM rooms
    WHERE status = 'active' AND deleted_at IS NULL
      AND unaccent(title) ILIKE unaccent(${'%' + keyword + '%'})
    ORDER BY is_verified DESC, created_at DESC
    LIMIT 30;
  `;
}
```

## Do NOT
- Use `$queryRawUnsafe` with hand-concatenated strings built from user-supplied query params.
- Forget `deletedAt: null` / `status: 'active'` on any public query.
- Drop `isVerified desc` from the order clause — this is a core product commitment (USP), not a minor detail.

## Checklist
- [ ] DTO has `@Type(() => Number)` for every numeric query param (query strings are always strings)
- [ ] Always `status: 'active'`, `deletedAt: null` on public endpoints
- [ ] `isVerified desc` is the first order condition
- [ ] Raw queries use tagged templates (`$queryRaw` + `Prisma.sql`), never unsafe strings
- [ ] Pagination present, returns `total`
- [ ] Endpoint has rate limiting if it's easy to abuse (scraping)
