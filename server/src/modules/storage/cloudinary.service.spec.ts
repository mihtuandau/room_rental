import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

function createService(uploadPreset?: string) {
  const values: Record<string, string | undefined> = {
    CLOUDINARY_CLOUD_NAME: 'demo',
    CLOUDINARY_API_KEY: 'api-key',
    CLOUDINARY_API_SECRET: 'api-secret',
    CLOUDINARY_UPLOAD_PRESET: uploadPreset,
  };
  const config = {
    get: jest.fn((key: string) => values[key]),
  };
  return new CloudinaryService(config as unknown as ConfigService);
}

describe('CloudinaryService', () => {
  it('creates a signed upload without requiring an upload preset', () => {
    const signature = createService().createUploadSignature('rooms/user-1/12');

    expect(signature.uploadPreset).toBeUndefined();
    expect(signature.publicId).toMatch(/^rooms\/user-1\/12\//);
    expect(signature.signature).toEqual(expect.any(String));
    expect(signature.uploadUrl).toBe(
      'https://api.cloudinary.com/v1_1/demo/image/upload',
    );
  });

  it('returns the preset when it is part of the signed parameters', () => {
    const signature =
      createService('roomrent-images').createUploadSignature('rooms/user-1/12');

    expect(signature.uploadPreset).toBe('roomrent-images');
    expect(signature.signature).toEqual(expect.any(String));
  });
});
