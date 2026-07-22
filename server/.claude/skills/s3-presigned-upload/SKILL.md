---
name: s3-presigned-upload
description: Build the flow for uploading room images to S3-compatible storage (R2/Spaces) using presigned URLs for the RoomRent backend. MUST use this skill for any upload feature — even when the user just says "let landlords post room photos", "upload avatar", "store verification document images". Nest does NOT keep files around long-term — it only issues presigned URLs so the client uploads straight to S3, and the backend only stores the key/URL.
---

# Uploading images via Presigned URL (S3-compatible)

Principle: **the client uploads directly to S3, never routing through the Nest server**. The server only does 2 things: (1) issue a presigned URL with a valid signature that's short-lived, (2) after the client finishes uploading, confirm and store the key/URL in the DB.

## Why not let Nest hold the file
- Avoids taxing server RAM/disk when images are large or many users upload concurrently.
- Presigned URLs expire on their own (typically 1–5 minutes) → limits the blast radius if a URL leaks.
- Can swap S3-compatible providers (R2, Spaces, MinIO) without changing backend logic.

## Template: S3 service wrapper

`src/modules/storage/s3.service.ts`
```ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>("S3_BUCKET")!;
    this.client = new S3Client({
      region: this.config.get<string>("S3_REGION"),
      credentials: {
        accessKeyId: this.config.get<string>("S3_ACCESS_KEY_ID")!,
        secretAccessKey: this.config.get<string>("S3_SECRET_ACCESS_KEY")!,
      },
    });
  }

  async createPresignedUploadUrl(folder: string, mimeType: string) {
    const ext = mimeType.split("/")[1] ?? "bin";
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 120 }); // 2 minutes

    return { uploadUrl, key, publicUrl: `${this.config.get("S3_PUBLIC_BASE_URL")}/${key}` };
  }

  async deleteObject(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
```

## Template: presigned URL request DTO

`src/modules/storage/dto/presign-upload.dto.ts`
```ts
import { IsIn, IsString } from "class-validator";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class PresignUploadDto {
  @IsString() @IsIn(ALLOWED_MIME_TYPES)
  mimeType: string;
}
```

## Template: Controller

```ts
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { S3Service } from "./s3.service";
import { PresignUploadDto } from "./dto/presign-upload.dto";

@ApiTags("storage")
@Controller("storage")
export class StorageController {
  constructor(private s3Service: S3Service) {}

  @Post("presign/room-image")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Request a presigned URL to upload a room image" })
  presignRoomImage(@Body() dto: PresignUploadDto) {
    return this.s3Service.createPresignedUploadUrl("rooms", dto.mimeType);
  }
}
```

## Template: confirming after the client finishes uploading

The client uploads directly to `uploadUrl` (a PUT request), then calls the confirm endpoint so the backend can store the image record:

```ts
@Post(":roomId/images/confirm")
@UseGuards(JwtAuthGuard)
async confirmImage(
  @CurrentUser("id") userId: string,
  @Param("roomId") roomId: string,
  @Body() dto: ConfirmImageDto, // { key: string, publicUrl: string, isCover?: boolean }
) {
  const room = await this.roomsService.findOwned(userId, Number(roomId)); // throws ForbiddenException if not the owner
  return this.prisma.roomImage.create({
    data: { roomId: room.id, key: dto.key, url: dto.publicUrl, isCover: dto.isCover ?? false },
  });
}
```

## Overall flow (FE ↔ BE ↔ S3)

1. FE calls `POST /storage/presign/room-image` with `mimeType` → receives `{ uploadUrl, key, publicUrl }`.
2. FE `PUT`s the file directly to `uploadUrl` (never through the backend).
3. FE calls `POST /rooms/:id/images/confirm` with `key`/`publicUrl` → BE stores it in `RoomImage`.
4. When deleting an image: BE deletes the DB record **and** calls `s3Service.deleteObject(key)` so no orphaned object is left in storage.

## Do NOT
- Accept file uploads directly through Nest (`FileInterceptor`/multer saving to the server) for room images — only use presigned URLs.
- Skip whitelisting `mimeType`/extension — allowing executable file uploads (`.exe`, `.php`...) is a serious vulnerability.
- Use long-lived presigned URLs (>a few minutes) — increases risk if the URL leaks (logs, public network tab).
- Forget the ownership check (`ownerId === userId`) on the confirm/delete image endpoints — the presigned URL only controls who can upload, not who can attach an image to which room.

## Checklist
- [ ] `mimeType` whitelisted in the DTO before issuing a presigned URL
- [ ] Presigned URL has a short `expiresIn` (1–5 minutes)
- [ ] Both the presign and confirm endpoints have `JwtAuthGuard`
- [ ] Confirm/delete image endpoints check room ownership in the service
- [ ] Deleting an image in the DB also calls `deleteObject` to delete it from S3
