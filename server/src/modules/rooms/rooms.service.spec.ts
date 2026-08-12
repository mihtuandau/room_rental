import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  describe('featuredLocations', () => {
    it('ranks active areas and selects a public cover image', async () => {
      const prisma = {
        room: {
          groupBy: jest.fn().mockResolvedValue([
            {
              city: 'Hồ Chí Minh',
              district: 'Quận 7',
              _count: { _all: 3 },
              _min: { price: 2_000_000 },
            },
            {
              city: 'Đà Nẵng',
              district: 'Hải Châu',
              _count: { _all: 1 },
              _min: { price: 1_500_000 },
            },
          ]),
          findFirst: jest.fn().mockResolvedValue({
            images: [{ url: 'https://cdn.example/cover.jpg' }],
          }),
        },
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      await expect(service.featuredLocations(1)).resolves.toEqual([
        {
          city: 'Hồ Chí Minh',
          district: 'Quận 7',
          count: 3,
          minPrice: 2_000_000,
          imageUrl: 'https://cdn.example/cover.jpg',
        },
      ]);
      expect(prisma.room.groupBy).toHaveBeenCalledWith({
        by: ['city', 'district'],
        where: {
          status: 'active',
          deletedAt: null,
          owner: { is: { deletedAt: null } },
        },
        _count: { _all: true },
        _min: { price: true },
      });
    });
  });

  describe('search', () => {
    it('does not require coordinates for a normal search', async () => {
      const prisma = {
        $transaction: jest.fn((queries: unknown[]) => Promise.all(queries)),
        room: {
          findMany: jest.fn().mockResolvedValue([{ id: 1 }]),
          count: jest.fn().mockResolvedValue(1),
        },
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      const result = await service.search({ page: 1, pageSize: 12 });

      expect(prisma.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
            deletedAt: null,
          }),
        }),
      );
      expect(result.total).toBe(1);
    });

    it('returns a short-lived cached public search result when available', async () => {
      const cached = {
        rooms: [{ id: 99 }],
        total: 1,
        page: 1,
        pageSize: 12,
      };
      const prisma = {
        room: { findMany: jest.fn(), count: jest.fn() },
      };
      const cache = {
        get: jest.fn().mockResolvedValue(cached),
        set: jest.fn(),
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
        cache as never,
      );

      await expect(service.search({ page: 1, pageSize: 12 })).resolves.toEqual(
        cached,
      );
      expect(prisma.room.findMany).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('filters public results by radius around coordinates', async () => {
      const prisma = {
        $queryRaw: jest
          .fn()
          .mockResolvedValueOnce([{ count: BigInt(2) }])
          .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]),
        $transaction: jest.fn((queries: unknown[]) => Promise.all(queries)),
        room: {
          findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
          count: jest.fn().mockResolvedValue(2),
        },
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      const result = await service.search({
        lat: 16.0544,
        lng: 108.2022,
        radiusKm: 5,
        page: 1,
        pageSize: 12,
      });

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(prisma.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [1, 2] } },
        }),
      );
      expect(result).toEqual({
        rooms: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        pageSize: 12,
      });
    });

    it('rejects incomplete radius coordinates', async () => {
      const service = new RoomsService(
        {} as PrismaService,
        {} as CloudinaryService,
      );

      await expect(service.search({ lat: 16.0544 })).rejects.toThrow(
        'Both latitude and longitude are required for radius search.',
      );
    });

    it('rejects inverted numeric ranges before querying or caching', async () => {
      const cache = { get: jest.fn(), set: jest.fn() };
      const service = new RoomsService(
        {} as PrismaService,
        {} as CloudinaryService,
        cache as never,
      );

      await expect(
        service.search({ priceMin: 3_000_000, priceMax: 2_000_000 }),
      ).rejects.toThrow('Minimum price');
      await expect(
        service.search({ areaMin: 40, areaMax: 20 }),
      ).rejects.toThrow('Minimum area');
      expect(cache.get).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('allows posting with an unverified phone when a contact number exists', async () => {
      const prisma = {
        user: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            phone: '0912345678',
            contactPhone: null,
          }),
        },
        room: {
          create: jest.fn().mockResolvedValue({ id: 1, status: 'pending' }),
        },
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      await expect(
        service.create('user-1', {
          title: 'Phòng trọ an toàn gần trường',
          roomType: 'boarding_house',
          price: 2_500_000,
          city: 'Đà Nẵng',
          district: 'Hải Châu',
        }),
      ).resolves.toEqual({ id: 1, status: 'pending' });
      expect(prisma.room.create).toHaveBeenCalled();
    });
  });

  describe('findActiveBySlug', () => {
    it('does not select owner contact details for the public response', async () => {
      const room = {
        id: 42,
        slug: 'phong-tro-quan-7',
        status: 'active',
        deletedAt: null,
        viewCount: 3,
        owner: {
          id: 'owner-1',
          phone: '0912345678',
          contactPhone: null,
          isPhoneVerified: true,
          contactPhoneVerified: false,
          fullName: 'Nguyễn Văn A',
          avatarUrl: null,
          createdAt: new Date('2025-01-15T00:00:00.000Z'),
        },
        images: [],
        amenities: [],
      };
      const prisma = {
        room: {
          findFirst: jest.fn().mockResolvedValue(room),
          update: jest.fn().mockResolvedValue({ ...room, viewCount: 4 }),
        },
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      const result = await service.findActiveBySlug(room.slug);

      expect(prisma.room.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            slug: room.slug,
            status: 'active',
            deletedAt: null,
            owner: { is: { deletedAt: null } },
          },
          select: expect.objectContaining({
            images: expect.objectContaining({
              select: { id: true, url: true, isCover: true, position: true },
            }),
            owner: expect.objectContaining({
              select: expect.objectContaining({
                phone: true,
                contactPhone: true,
                isPhoneVerified: true,
                contactPhoneVerified: true,
              }),
            }),
          }),
        }),
      );
      expect(result.owner).toEqual({
        id: 'owner-1',
        fullName: 'Nguyễn Văn A',
        avatarUrl: null,
        createdAt: new Date('2025-01-15T00:00:00.000Z'),
        contactPhoneMasked: '09*****678',
        contactPhoneVerified: true,
      });
      expect(result.owner).not.toHaveProperty('contactPhone');
      expect(result.owner).not.toHaveProperty('zaloUrl');
    });
  });

  describe('setCoverImage', () => {
    it('atomically replaces the current cover for an owned room', async () => {
      const room = { id: 42, ownerId: 'owner-1', deletedAt: null };
      const image = {
        id: 'image-2',
        roomId: room.id,
        isCover: false,
      };
      const updatedImage = { ...image, isCover: true };
      const tx = {
        roomImage: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          update: jest.fn().mockResolvedValue(updatedImage),
        },
      };
      const prisma = {
        room: { findUnique: jest.fn().mockResolvedValue(room) },
        roomImage: { findUnique: jest.fn().mockResolvedValue(image) },
        $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
          callback(tx),
        ),
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      const result = await service.setCoverImage(
        room.ownerId,
        room.id,
        image.id,
      );

      expect(tx.roomImage.updateMany).toHaveBeenCalledWith({
        where: { roomId: room.id, isCover: true },
        data: { isCover: false },
      });
      expect(tx.roomImage.update).toHaveBeenCalledWith({
        where: { id: image.id },
        data: { isCover: true },
      });
      expect(result).toEqual(updatedImage);
    });

    it('rejects a caller who does not own the room', async () => {
      const prisma = {
        room: {
          findUnique: jest.fn().mockResolvedValue({
            id: 42,
            ownerId: 'another-owner',
            deletedAt: null,
          }),
        },
        roomImage: { findUnique: jest.fn() },
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      await expect(
        service.setCoverImage('caller-1', 42, 'image-2'),
      ).rejects.toThrow('You do not have permission to modify this listing.');
      expect(prisma.roomImage.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('returns an active listing to moderation after owner edits it', async () => {
      const room = {
        id: 42,
        ownerId: 'owner-1',
        status: 'active',
        deletedAt: null,
      };
      const tx = {
        room: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            ...room,
            status: 'pending',
          }),
        },
      };
      const prisma = {
        room: { findUnique: jest.fn().mockResolvedValue(room) },
        $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
          callback(tx),
        ),
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        {} as CloudinaryService,
      );

      await expect(
        service.update(room.ownerId, room.id, { title: 'Updated title' }),
      ).resolves.toMatchObject({ status: 'pending' });
      expect(tx.room.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
          data: expect.objectContaining({
            status: 'pending',
            isVerified: false,
          }),
        }),
      );
    });
  });

  describe('addImage', () => {
    it('stores only metadata verified by Cloudinary for an owned room', async () => {
      const room = { id: 42, ownerId: 'owner-1', deletedAt: null };
      const verified = {
        key: 'rooms/owner-1/42/safe-image',
        url: 'https://res.cloudinary.com/demo/image/upload/safe-image.jpg',
      };
      const created = { id: 'image-1', roomId: room.id, ...verified };
      const tx = {
        roomImage: {
          updateMany: jest.fn(),
          create: jest.fn().mockResolvedValue(created),
        },
      };
      const prisma = {
        room: { findUnique: jest.fn().mockResolvedValue(room) },
        roomImage: {
          count: jest.fn().mockResolvedValue(0),
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null),
        },
        $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
          callback(tx),
        ),
      };
      const cloudinary = {
        verifyRoomImage: jest.fn().mockResolvedValue(verified),
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        cloudinary as unknown as CloudinaryService,
      );

      const result = await service.addImage(room.ownerId, room.id, {
        key: verified.key,
        isCover: false,
      });

      expect(cloudinary.verifyRoomImage).toHaveBeenCalledWith(
        verified.key,
        room.ownerId,
        room.id,
      );
      expect(tx.roomImage.create).toHaveBeenCalledWith({
        data: {
          roomId: room.id,
          key: verified.key,
          url: verified.url,
          isCover: true,
          position: 0,
        },
      });
      expect(result).toEqual(created);
    });

    it('does not write anything when Cloudinary rejects the identifier', async () => {
      const room = { id: 42, ownerId: 'owner-1', deletedAt: null };
      const prisma = {
        room: { findUnique: jest.fn().mockResolvedValue(room) },
        roomImage: { count: jest.fn(), findFirst: jest.fn() },
        $transaction: jest.fn(),
      };
      const cloudinary = {
        verifyRoomImage: jest
          .fn()
          .mockRejectedValue(new Error('Invalid room image identifier.')),
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        cloudinary as unknown as CloudinaryService,
      );

      await expect(
        service.addImage(room.ownerId, room.id, {
          key: 'rooms/another-owner/99/stolen-image',
        }),
      ).rejects.toThrow('Invalid room image identifier.');
      expect(prisma.roomImage.count).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('removeImage', () => {
    it('promotes the next image when the deleted image was the cover', async () => {
      const room = { id: 42, ownerId: 'owner-1', deletedAt: null };
      const cover = {
        id: 'image-1',
        roomId: room.id,
        key: 'rooms/owner-1/42/image-1',
        isCover: true,
      };
      const nextImage = { id: 'image-2', roomId: room.id, isCover: false };
      const tx = {
        roomImage: {
          delete: jest.fn().mockResolvedValue(cover),
          findFirst: jest.fn().mockResolvedValue(nextImage),
          update: jest.fn().mockResolvedValue({ ...nextImage, isCover: true }),
        },
      };
      const prisma = {
        room: { findUnique: jest.fn().mockResolvedValue(room) },
        roomImage: { findUnique: jest.fn().mockResolvedValue(cover) },
        $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
          callback(tx),
        ),
      };
      const cloudinary = {
        destroyAsset: jest.fn().mockResolvedValue(undefined),
        isOwnedRoomImagePublicId: jest.fn().mockReturnValue(true),
        warnLegacyAssetNotDestroyed: jest.fn(),
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        cloudinary as unknown as CloudinaryService,
      );

      await service.removeImage(room.ownerId, room.id, cover.id);

      expect(tx.roomImage.findFirst).toHaveBeenCalledWith({
        where: { roomId: room.id },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      });
      expect(tx.roomImage.update).toHaveBeenCalledWith({
        where: { id: nextImage.id },
        data: { isCover: true },
      });
      expect(cloudinary.destroyAsset).toHaveBeenCalledWith(cover.key);
    });

    it('does not destroy legacy unscoped Cloudinary keys', async () => {
      const room = { id: 42, ownerId: 'owner-1', deletedAt: null };
      const image = {
        id: 'legacy-image',
        roomId: room.id,
        key: 'rooms/legacy-shared-key',
        isCover: false,
      };
      const tx = {
        roomImage: {
          delete: jest.fn().mockResolvedValue(image),
          findFirst: jest.fn(),
          update: jest.fn(),
        },
      };
      const prisma = {
        room: { findUnique: jest.fn().mockResolvedValue(room) },
        roomImage: { findUnique: jest.fn().mockResolvedValue(image) },
        $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
          callback(tx),
        ),
      };
      const cloudinary = {
        destroyAsset: jest.fn(),
        isOwnedRoomImagePublicId: jest.fn().mockReturnValue(false),
        warnLegacyAssetNotDestroyed: jest.fn(),
      };
      const service = new RoomsService(
        prisma as unknown as PrismaService,
        cloudinary as unknown as CloudinaryService,
      );

      await service.removeImage(room.ownerId, room.id, image.id);

      expect(cloudinary.destroyAsset).not.toHaveBeenCalled();
      expect(cloudinary.warnLegacyAssetNotDestroyed).toHaveBeenCalledWith(
        image.key,
        room.id,
      );
    });
  });
});
