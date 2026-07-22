---
name: cloudinary-upload
description: Build the flow for uploading room images to Cloudinary for the RoomRent backend. MUST use this skill for any upload feature — even when the user just says "let landlords post room photos", "upload avatar", "store verification document images". Nest does NOT keep files around long-term — it only issues a signed upload signature so the client uploads straight to Cloudinary, and the backend only stores the returned public_id/secure_url.
---

# Uploading images via Cloudinary (signed upload)

Principle: **the client uploads directly to Cloudinary, never routing through the Nest server**. The server only does 2 things: (1) issue a short-lived signed upload signature, (2) after the client finishes uploading, confirm and store the `public_id`/`secure_url` in the DB.

## Why not let Nest hold the file
- Avoids taxing server RAM/disk when images are large or many users upload concurrently.
- The signature is timestamp-bound — a leaked signature is only useful for a narrow window before Cloudinary rejects it.
- Cloudinary handles resizing/transformations/CDN delivery — the backend never touches image bytes.

## Template: Cloudinary service wrapper

`src/modules/storage/cloudinary.service.ts`
```ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

@Injectable()
export class CloudinaryService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(private config: ConfigService) {
    this.cloudName = this.config.get<string>("CLOUDINARY_CLOUD_NAME")!;
    this.apiKey = this.config.get<string>("CLOUDINARY_API_KEY")!;
    this.apiSecret = this.config.get<string>("CLOUDINARY_API_SECRET")!;

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  // Client uploads straight to Cloudinary using these signed params — the raw
  // file bytes never pass through our server (same principle as a presigned S3 URL).
  createUploadSignature(folder: string) {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret);

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      folder,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }

  async destroyAsset(publicId: string) {
    await cloudinary.uploader.destroy(publicId);
  }
}
```

## Template: Controller (presign)

```ts
import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CloudinaryService } from "./cloudinary.service";

@ApiTags("storage")
@Controller("storage")
export class StorageController {
  constructor(private cloudinaryService: CloudinaryService) {}

  @Post("presign/room-image")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get signed params to upload a room image directly to Cloudinary" })
  presignRoomImage() {
    return this.cloudinaryService.createUploadSignature("rooms");
  }
}
```

The client then `POST`s the file as `multipart/form-data` straight to the returned `uploadUrl`, including the exact `apiKey`, `timestamp`, `folder`, and `signature` fields alongside the file — Cloudinary rejects the request if any signed param doesn't match.

## Template: confirming after the client finishes uploading

Cloudinary's own upload response contains `public_id` and `secure_url`; the client forwards those to our confirm endpoint:

```ts
@Post(":roomId/images/confirm")
@UseGuards(JwtAuthGuard)
async confirmImage(
  @CurrentUser("id") userId: string,
  @Param("roomId") roomId: string,
  @Body() dto: ConfirmImageDto, // { key: string /* public_id */, url: string /* secure_url */, isCover?: boolean }
) {
  const room = await this.findOwned(userId, Number(roomId)); // throws ForbiddenException if not the owner
  return this.prisma.roomImage.create({
    data: { roomId: room.id, key: dto.key, url: dto.url, isCover: dto.isCover ?? false },
  });
}
```

## Overall flow (FE ↔ BE ↔ Cloudinary)

1. FE calls `POST /storage/presign/room-image` → receives `{ cloudName, apiKey, timestamp, folder, signature, uploadUrl }`.
2. FE `POST`s the file as `multipart/form-data` directly to `uploadUrl`, including those exact signed fields (never through the backend).
3. Cloudinary responds to the FE with `public_id` + `secure_url`.
4. FE calls `POST /rooms/:id/images/confirm` with `{ key: public_id, url: secure_url }` → BE stores it in `RoomImage`.
5. When deleting an image: BE deletes the DB record **and** calls `cloudinaryService.destroyAsset(key)` so no orphaned asset is left on Cloudinary.

## Do NOT
- Accept file uploads directly through Nest (`FileInterceptor`/multer saving to the server) for room images — only use the signed-upload flow.
- Sign more params than necessary, or forget that **every** param passed to Cloudinary's upload call that is also in `paramsToSign` must match exactly, or the signature check fails.
- Forget the ownership check (`ownerId === userId`) on the confirm/delete image endpoints — the signature only controls who can upload to Cloudinary, not who can attach an image to which room.
- Log or return `CLOUDINARY_API_SECRET` anywhere — only the signature (a one-way hash) is ever sent to the client.

## Checklist
- [ ] Presign endpoint has `JwtAuthGuard`
- [ ] Signature generated with a fresh `timestamp` per request (no caching/reuse)
- [ ] Confirm/delete image endpoints check room ownership in the service
- [ ] Deleting an image in the DB also calls `destroyAsset` to remove it from Cloudinary
- [ ] `CLOUDINARY_API_SECRET` never leaves the server
