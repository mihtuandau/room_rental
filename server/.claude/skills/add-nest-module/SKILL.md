---
name: add-nest-module
description: Create or modify a NestJS module (controller + service + DTO) for the RoomRent project — room CRUD, favorites, reports, contact logs, or any new endpoint. MUST use this skill whenever adding an API endpoint or handling a request from the frontend, or "build an API for X" — even when the user just says "add feature Y" or "let users do Z". Always ensures: DTO validation, JwtAuthGuard, ownership check in the service, Swagger docs.
---

# Creating a standard NestJS module

There is no RLS at the DB layer — this module is the **only** place responsible for securing the request. Missing one step means a security hole.

## Mandatory scaffold for every mutation endpoint

1. `@UseGuards(JwtAuthGuard)` (+ `@UseGuards(RolesGuard)` if the endpoint is role-restricted).
2. A `class-validator` DTO for the request body/query.
3. Controller reads the current user via the `@CurrentUser()` decorator — **never** read `req.user` directly.
4. Service checks ownership (`ownerId === userId`) before update/delete.
5. Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`).
6. Return errors via standard NestJS exceptions (`NotFoundException`, `ForbiddenException`...).

## Template: DTO

`src/modules/rooms/dto/create-room.dto.ts`
```ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Length, Min } from "class-validator";
import { RoomType } from "@prisma/client";

export class CreateRoomDto {
  @ApiProperty() @IsString() @Length(10, 120)
  title: string;

  @ApiProperty({ enum: RoomType }) @IsEnum(RoomType)
  roomType: RoomType;

  @ApiProperty() @IsInt() @IsPositive()
  price: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0)
  deposit?: number;

  @ApiProperty() @IsString()
  city: string;

  @ApiProperty() @IsString()
  district: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  ward?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  description?: string;
}
```

## Template: Controller

`src/modules/rooms/rooms.controller.ts`
```ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { SearchRoomsDto } from "./dto/search-rooms.dto";

@ApiTags("rooms")
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: "Public room search / listing" })
  search(@Query() query: SearchRoomsDto) {
    return this.roomsService.search(query);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Room detail by slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.roomsService.findActiveBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Landlord creates a new listing (status: pending)" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(userId, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Landlord soft-deletes their own listing" })
  remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.roomsService.softDelete(userId, Number(id));
  }
}
```

## Template: Service (ownership check — mandatory)

`src/modules/rooms/rooms.service.ts`
```ts
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { slugify } from "@/common/utils/slugify";

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        ...dto,
        ownerId: userId,
        slug: `${slugify(dto.title)}-${Date.now().toString(36)}`,
        status: "pending", // always awaits admin approval
      },
    });
  }

  async findActiveBySlug(slug: string) {
    const room = await this.prisma.room.findFirst({
      where: { slug, status: "active", deletedAt: null },
      include: { images: true },
    });
    if (!room) throw new NotFoundException("Listing not found.");
    return room;
  }

  async softDelete(userId: string, roomId: number) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.deletedAt) throw new NotFoundException();
    // ownership check — there's no RLS to rely on, must be done here
    if (room.ownerId !== userId) throw new ForbiddenException("You do not have permission to delete this listing.");

    return this.prisma.room.update({
      where: { id: roomId },
      data: { deletedAt: new Date() },
    });
  }
}
```

## Template: role-restricted guard (used in the admin module)

```ts
@Roles("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Patch(":id/approve")
approve(@Param("id") id: string) {
  return this.roomsService.approve(Number(id));
}
```

## Do NOT
- Let the service read `req`/`res` directly — it should only receive parameters already extracted by the controller.
- Skip the `ownerId` check because "the guard already handles it" — the guard only authenticates *who is calling*, not *whether they own this record*.
- Return a raw Prisma object containing `passwordHash` or other internal fields in the response.

## Checklist
- [ ] DTO with `class-validator` for every input
- [ ] `JwtAuthGuard` (+ `RolesGuard` if needed) on endpoints that require login
- [ ] Service checks ownership before update/delete
- [ ] Public queries always filter `status: 'active', deletedAt: null`
- [ ] Full Swagger decorators
- [ ] No sensitive fields leaked in the response
