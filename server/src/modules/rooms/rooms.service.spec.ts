import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
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
          fullName: 'Nguyễn Văn A',
          avatarUrl: null,
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

      expect(prisma.room.findFirst).toHaveBeenCalledWith({
        where: {
          slug: room.slug,
          status: 'active',
          deletedAt: null,
        },
        include: {
          images: {
            orderBy: [
              { isCover: 'desc' },
              { position: 'asc' },
              { createdAt: 'asc' },
            ],
          },
          owner: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          amenities: { include: { amenity: true } },
        },
      });
      expect(result.owner).toEqual({
        id: 'owner-1',
        fullName: 'Nguyễn Văn A',
        avatarUrl: null,
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
        $transaction: jest.fn(
          async (callback: (transaction: typeof tx) => unknown) => callback(tx),
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
      ).rejects.toThrow(
        'You do not have permission to modify this listing.',
      );
      expect(prisma.roomImage.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('removeImage', () => {
    it('promotes the next image when the deleted image was the cover', async () => {
      const room = { id: 42, ownerId: 'owner-1', deletedAt: null };
      const cover = {
        id: 'image-1',
        roomId: room.id,
        key: 'rooms/image-1',
        isCover: true,
      };
      const nextImage = { id: 'image-2', roomId: room.id, isCover: false };
      const tx = {
        roomImage: {
          delete: jest.fn().mockResolvedValue(cover),
          findFirst: jest.fn().mockResolvedValue(nextImage),
          update: jest
            .fn()
            .mockResolvedValue({ ...nextImage, isCover: true }),
        },
      };
      const prisma = {
        room: { findUnique: jest.fn().mockResolvedValue(room) },
        roomImage: { findUnique: jest.fn().mockResolvedValue(cover) },
        $transaction: jest.fn(
          async (callback: (transaction: typeof tx) => unknown) => callback(tx),
        ),
      };
      const cloudinary = {
        destroyAsset: jest.fn().mockResolvedValue(undefined),
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
  });
});
