import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/lib/api-client';
import { deleteUnconfirmedRoomImage, uploadToCloudinary } from './api';

vi.mock('@/lib/api-client', () => ({ apiRequest: vi.fn() }));

describe('uploadToCloudinary', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          public_id: 'rooms/user-1/12/image-1',
          secure_url: 'https://res.cloudinary.com/demo/image/upload/image-1',
        }),
      }),
    );
  });

  it('rejects room uploads without a room id', async () => {
    await expect(uploadToCloudinary(new File(['image'], 'room.jpg'))).rejects.toThrow(
      'Thiếu mã tin đăng',
    );
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('requests a signed upload and forwards every signed parameter', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      cloudName: 'demo',
      apiKey: 'key',
      timestamp: 123,
      publicId: 'rooms/user-1/12/image-1',
      overwrite: false,
      allowedFormats: 'jpg,png,webp',
      uploadPreset: 'roomrent-images',
      signature: 'signature',
      uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
    });

    const result = await uploadToCloudinary(new File(['image'], 'room.jpg'), 'room-image', 12);
    expect(result.public_id).toContain('rooms/user-1/12');
    expect(apiRequest).toHaveBeenCalledWith('/storage/presign/room-image/12', { method: 'POST' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/demo/image/upload',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    );
    const uploadBody = vi.mocked(fetch).mock.calls[0]?.[1]?.body as FormData;
    expect(uploadBody.get('upload_preset')).toBe('roomrent-images');
  });

  it('uploads with a signed request when no upload preset is configured', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      cloudName: 'demo',
      apiKey: 'key',
      timestamp: 123,
      publicId: 'rooms/user-1/12/image-1',
      overwrite: false,
      allowedFormats: 'jpg,png,webp',
      signature: 'signature',
      uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
    });

    await uploadToCloudinary(new File(['image'], 'room.jpg'), 'room-image', 12);

    const uploadBody = vi.mocked(fetch).mock.calls[0]?.[1]?.body as FormData;
    expect(uploadBody.get('upload_preset')).toBeNull();
  });

  it('can clean up a Cloudinary asset that was uploaded but not confirmed', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ success: true });

    await expect(
      deleteUnconfirmedRoomImage(12, 'rooms/user-1/12/image-1'),
    ).resolves.toEqual({ success: true });
    expect(apiRequest).toHaveBeenCalledWith(
      '/storage/room-image/12/unconfirmed',
      {
        method: 'DELETE',
        body: JSON.stringify({ publicId: 'rooms/user-1/12/image-1' }),
      },
    );
  });
});
