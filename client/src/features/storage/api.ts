import { apiRequest } from '@/lib/api-client';

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  publicId: string;
  overwrite: false;
  allowedFormats: string;
  signature: string;
  uploadUrl: string;
}

interface CloudinaryResult {
  public_id: string;
  secure_url: string;
}

function getSignature(kind: 'room-image' | 'avatar', roomId?: number) {
  const path =
    kind === 'room-image'
      ? `/storage/presign/room-image/${roomId}`
      : '/storage/presign/avatar';
  return apiRequest<UploadSignature>(path, { method: 'POST' });
}

/** Uploads one file directly to Cloudinary (never through our backend) and returns its identifiers. */
export async function uploadToCloudinary(
  file: File,
  kind: 'room-image' | 'avatar' = 'room-image',
  roomId?: number,
): Promise<CloudinaryResult> {
  if (kind === 'room-image' && roomId == null) {
    throw new Error('Thiếu mã tin đăng để tải ảnh.');
  }
  const sig = await getSignature(kind, roomId);

  // Every signed param must be sent back exactly as received, or Cloudinary
  // rejects the signature.
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('public_id', sig.publicId);
  form.append('overwrite', String(sig.overwrite));
  form.append('allowed_formats', sig.allowedFormats);
  form.append('signature', sig.signature);

  // No Authorization header, no credentials — this is a third-party request.
  const res = await fetch(sig.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Tải ảnh lên thất bại.');
  return (await res.json()) as CloudinaryResult;
}

export function deleteUnconfirmedRoomImage(roomId: number, publicId: string) {
  return apiRequest<{ success: boolean }>(
    `/storage/room-image/${roomId}/unconfirmed`,
    {
      method: 'DELETE',
      body: JSON.stringify({ publicId }),
    },
  );
}
