import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  it('issues a room-scoped signature only to the listing owner', async () => {
    const prisma = {
      room: {
        findUnique: jest.fn().mockResolvedValue({
          ownerId: 'owner-1',
          deletedAt: null,
        }),
      },
      roomImage: { count: jest.fn().mockResolvedValue(2) },
    };
    const cloudinary = {
      roomImagePrefix: jest.fn().mockReturnValue('rooms/owner-1/42'),
      createUploadSignature: jest.fn().mockReturnValue({ signature: 'signed' }),
    };
    const service = new StorageService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
    );

    await expect(
      service.createRoomImageSignature('owner-1', 42),
    ).resolves.toEqual({ signature: 'signed' });
    expect(cloudinary.createUploadSignature).toHaveBeenCalledWith(
      'rooms/owner-1/42',
    );
  });

  it('rejects a signature request from a non-owner', async () => {
    const prisma = {
      room: {
        findUnique: jest.fn().mockResolvedValue({
          ownerId: 'owner-2',
          deletedAt: null,
        }),
      },
      roomImage: { count: jest.fn() },
    };
    const cloudinary = {
      roomImagePrefix: jest.fn(),
      createUploadSignature: jest.fn(),
    };
    const service = new StorageService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
    );

    await expect(
      service.createRoomImageSignature('owner-1', 42),
    ).rejects.toThrow(
      'You do not have permission to upload images for this listing.',
    );
    expect(prisma.roomImage.count).not.toHaveBeenCalled();
    expect(cloudinary.createUploadSignature).not.toHaveBeenCalled();
  });

  it('does not issue more signatures after the listing reaches its image limit', async () => {
    const prisma = {
      room: {
        findUnique: jest.fn().mockResolvedValue({
          ownerId: 'owner-1',
          deletedAt: null,
        }),
      },
      roomImage: { count: jest.fn().mockResolvedValue(10) },
    };
    const cloudinary = {
      roomImagePrefix: jest.fn(),
      createUploadSignature: jest.fn(),
    };
    const service = new StorageService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
    );

    await expect(
      service.createRoomImageSignature('owner-1', 42),
    ).rejects.toThrow('A listing can have at most 10 images.');
    expect(cloudinary.createUploadSignature).not.toHaveBeenCalled();
  });

  it('deletes only an owned, unconfirmed Cloudinary image', async () => {
    const prisma = {
      room: {
        findUnique: jest.fn().mockResolvedValue({
          ownerId: 'owner-1',
          deletedAt: null,
        }),
      },
      roomImage: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const cloudinary = {
      isOwnedRoomImagePublicId: jest.fn().mockReturnValue(true),
      destroyAsset: jest.fn().mockResolvedValue(undefined),
    };
    const service = new StorageService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
    );

    await expect(
      service.deleteUnconfirmedRoomImage(
        'owner-1',
        42,
        'rooms/owner-1/42/orphan',
      ),
    ).resolves.toEqual({ success: true });
    expect(cloudinary.destroyAsset).toHaveBeenCalledWith(
      'rooms/owner-1/42/orphan',
    );
  });
});
