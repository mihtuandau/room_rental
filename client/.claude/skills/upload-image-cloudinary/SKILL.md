---
name: upload-image-cloudinary
description: Implement the frontend side of RoomRent's image upload — request signed params from the backend, upload the file straight to Cloudinary, then confirm the resulting public_id/secure_url back to the API. MUST use this skill for any image upload — even when the user just says "let landlords add photos", "upload an avatar", "add a cover image". The file must never be POSTed to our own backend.
---

# Uploading an image to Cloudinary

Three steps, and the file bytes never touch our server:

```
1. POST /api/proxy/storage/presign/room-image   → { cloudName, apiKey, timestamp, folder, signature, uploadUrl }
2. POST <uploadUrl>  (multipart, direct to Cloudinary, NOT through our backend)
                                                 → { public_id, secure_url, ... }
3. POST /api/proxy/rooms/:id/images/confirm      → { key: public_id, url: secure_url, isCover }
```

Avatars use `POST /storage/presign/avatar` for step 1, then `PATCH /users/me` with
`{ avatarUrl }` for step 3 — there's no separate confirm endpoint for avatars.

## Backend constraints to respect

- **10 images per listing.** The 11th confirm returns 400
  ("A listing can have at most 10 images."). Enforce the limit in the UI too.
- **One cover image.** Confirming with `isCover: true` clears the flag on the previous
  cover inside a transaction — never try to manage that client-side.
- The signature is timestamp-bound, so **request a fresh one per file**. Reusing a
  signature across uploads will start failing once Cloudinary considers it stale.

## Template: upload helper

`src/features/storage/api.ts`
```ts
import { apiRequest } from "@/lib/api-client";

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

interface CloudinaryResult {
  public_id: string;
  secure_url: string;
}

function getSignature(kind: "room-image" | "avatar") {
  return apiRequest<UploadSignature>(`/storage/presign/${kind}`, { method: "POST" });
}

/** Uploads one file directly to Cloudinary and returns its identifiers. */
export async function uploadToCloudinary(
  file: File,
  kind: "room-image" | "avatar" = "room-image",
): Promise<CloudinaryResult> {
  const sig = await getSignature(kind);

  // Every signed param must be sent back exactly as received, or Cloudinary
  // rejects the signature.
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  // Note: no Authorization header and no credentials — this is a third-party
  // request, and sending our cookies to Cloudinary would be wrong.
  const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
  if (!res.ok) throw new Error("Tải ảnh lên thất bại.");
  return (await res.json()) as CloudinaryResult;
}
```

## Template: attach the image to a listing

```ts
export function confirmRoomImage(
  roomId: number,
  image: CloudinaryResult,
  isCover = false,
) {
  return apiRequest(`/rooms/${roomId}/images/confirm`, {
    method: "POST",
    body: JSON.stringify({ key: image.public_id, url: image.secure_url, isCover }),
  });
}

export function deleteRoomImage(roomId: number, imageId: string) {
  // removes the DB row and destroys the Cloudinary asset
  return apiRequest(`/rooms/${roomId}/images/${imageId}`, { method: "DELETE" });
}
```

## Template: the uploader component

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadToCloudinary, confirmRoomImage } from "@/features/storage/api";
import { roomKeys } from "@/features/rooms/hooks";

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function RoomImageUploader({
  roomId,
  currentCount,
}: {
  roomId: number;
  currentCount: number;
}) {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      let done = 0;
      // Sequential, not Promise.all: each file needs its own fresh signature, and
      // the first image must land before the cover flag is meaningful.
      for (const file of files) {
        const uploaded = await uploadToCloudinary(file);
        await confirmRoomImage(roomId, uploaded, currentCount === 0 && done === 0);
        setProgress({ done: ++done, total: files.length });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.mine() });
      toast.success("Đã tải ảnh lên.");
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setProgress(null),
  });

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);

    // Validate before uploading — a rejected file after upload wastes the user's data
    const tooBig = files.find((f) => f.size > MAX_BYTES);
    if (tooBig) return toast.error(`"${tooBig.name}" vượt quá 5MB.`);

    const badType = files.find((f) => !ACCEPTED.includes(f.type));
    if (badType) return toast.error("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.");

    if (currentCount + files.length > MAX_IMAGES) {
      return toast.error(`Mỗi tin chỉ đăng tối đa ${MAX_IMAGES} ảnh.`);
    }

    upload.mutate(files);
  }

  const remaining = MAX_IMAGES - currentCount;

  return (
    <div>
      <input
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        disabled={upload.isPending || remaining <= 0}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-1 text-sm text-zinc-600">Còn có thể thêm {remaining} ảnh.</p>
      {progress && <p className="text-sm">Đang tải {progress.done}/{progress.total}…</p>}
    </div>
  );
}
```

## Displaying Cloudinary images

Request a resized image rather than the full-size original — insert transformation
parameters into the URL:

```ts
/** https://res.cloudinary.com/<cloud>/image/upload/<transform>/v123/rooms/abc.jpg */
export function cloudinaryThumb(url: string, width = 400) {
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}
```

For `next/image`, add the Cloudinary host to `next.config.ts`:
```ts
images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] }
```

## Do NOT
- POST the file to our own backend — it only ever issues signatures and stores URLs.
- Reuse one signature for several files.
- Alter or omit any signed parameter (`timestamp`, `folder`, `api_key`) when posting to Cloudinary.
- Send `credentials: "include"` or an `Authorization` header to Cloudinary.
- Skip the confirm step — the image exists on Cloudinary but the listing never shows it.
- Manage the cover flag client-side by unsetting others; the backend does it atomically.

## Checklist
- [ ] A fresh signature is requested per file
- [ ] File type and size validated before uploading
- [ ] The 10-image limit enforced in the UI, not just relied on from the 400
- [ ] Confirm called after every successful upload
- [ ] Cover chosen via `isCover: true` on confirm
- [ ] Query cache invalidated so the new image appears
- [ ] Display URLs use Cloudinary transformations, not the raw original
