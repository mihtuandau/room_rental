import { apiRequest } from '@/lib/api-client';

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

function getSignature(kind: 'room-image' | 'avatar') {
  return apiRequest<UploadSignature>(`/storage/presign/${kind}`, { method: 'POST' });
}

/** Uploads one file directly to Cloudinary (never through our backend) and returns its identifiers. */
export async function uploadToCloudinary(
  file: File,
  kind: 'room-image' | 'avatar' = 'room-image',
): Promise<CloudinaryResult> {
  const sig = await getSignature(kind);

  // Every signed param must be sent back exactly as received, or Cloudinary
  // rejects the signature.
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  // No Authorization header, no credentials — this is a third-party request.
  const res = await fetch(sig.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Tải ảnh lên thất bại.');
  return (await res.json()) as CloudinaryResult;
}
