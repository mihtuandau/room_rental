import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ModerationAction,
  RoomStatus,
} from '../../../../generated/prisma/client';
import { AdminRoomsService } from './admin-rooms.service';

describe('AdminRoomsService', () => {
  const tx = {
    room: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
    roomModeration: {
      create: jest.fn(),
    },
  };
  const prisma = {
    room: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const notifications = {
    onRoomApproved: jest.fn(),
    notifyListingApproved: jest.fn(),
    notifyListingRejected: jest.fn(),
  };
  const service = new AdminRoomsService(
    prisma as never,
    notifications as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    notifications.onRoomApproved.mockResolvedValue(undefined);
    notifications.notifyListingApproved.mockResolvedValue(undefined);
    notifications.notifyListingRejected.mockResolvedValue(undefined);
  });

  describe('getReviewDetail', () => {
    it('returns complete review data and flattens amenities', async () => {
      const room = {
        id: 42,
        deletedAt: null,
        images: [{ id: 'image-1', position: 0 }],
        amenities: [{ amenity: { id: 7, name: 'Air conditioning' } }],
        owner: { id: 'landlord-1', fullName: 'Landlord' },
        moderations: [{ id: 'moderation-1', admin: { id: 'admin-1' } }],
      };
      prisma.room.findUnique.mockResolvedValue(room);

      await expect(service.getReviewDetail(42)).resolves.toEqual({
        ...room,
        amenities: [{ id: 7, name: 'Air conditioning' }],
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        include: expect.objectContaining({
          images: { orderBy: { position: 'asc' } },
          amenities: { include: { amenity: true } },
          owner: expect.any(Object),
          moderations: expect.objectContaining({
            orderBy: { createdAt: 'desc' },
          }),
        }),
      });
    });

    it('does not expose a soft-deleted listing to review', async () => {
      prisma.room.findUnique.mockResolvedValue({
        id: 42,
        deletedAt: new Date(),
      });

      await expect(service.getReviewDetail(42)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('moderation transitions', () => {
    it('approves and writes the audit entry in one transaction', async () => {
      const pendingRoom = {
        id: 42,
        ownerId: 'owner-1',
        title: 'Room',
        status: RoomStatus.pending,
        deletedAt: null,
        publishedAt: null,
      };
      const approvedRoom = {
        ...pendingRoom,
        status: RoomStatus.active,
        publishedAt: new Date(),
      };
      tx.room.findUnique.mockResolvedValue(pendingRoom);
      tx.room.updateMany.mockResolvedValue({ count: 1 });
      tx.room.findUniqueOrThrow.mockResolvedValue(approvedRoom);
      tx.roomModeration.create.mockResolvedValue({});

      await expect(service.approve('admin-1', 42)).resolves.toBe(approvedRoom);

      expect(tx.room.updateMany).toHaveBeenCalledWith({
        where: {
          id: 42,
          status: RoomStatus.pending,
          deletedAt: null,
        },
        data: {
          status: RoomStatus.active,
          publishedAt: expect.any(Date),
        },
      });
      expect(tx.roomModeration.create).toHaveBeenCalledWith({
        data: {
          roomId: 42,
          adminId: 'admin-1',
          action: ModerationAction.approved,
          note: undefined,
        },
      });
      expect(notifications.onRoomApproved).toHaveBeenCalledWith(42);
      expect(notifications.notifyListingApproved).toHaveBeenCalledWith(
        approvedRoom,
      );
    });

    it('does not write an audit entry when a concurrent transition wins', async () => {
      tx.room.findUnique.mockResolvedValue({
        id: 42,
        status: RoomStatus.pending,
        deletedAt: null,
        publishedAt: null,
      });
      tx.room.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.approve('admin-1', 42)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(tx.roomModeration.create).not.toHaveBeenCalled();
      expect(notifications.onRoomApproved).not.toHaveBeenCalled();
    });
  });

  describe('setVerified', () => {
    it('records who verified the listing', async () => {
      tx.room.findUnique.mockResolvedValue({
        id: 42,
        isVerified: false,
        deletedAt: null,
      });
      tx.room.updateMany.mockResolvedValue({ count: 1 });
      tx.roomModeration.create.mockResolvedValue({});
      tx.room.findUniqueOrThrow.mockResolvedValue({
        id: 42,
        isVerified: true,
      });

      await service.setVerified('admin-1', 42, true);

      expect(tx.roomModeration.create).toHaveBeenCalledWith({
        data: {
          roomId: 42,
          adminId: 'admin-1',
          action: ModerationAction.verified,
        },
      });
    });

    it('keeps an identical verification request idempotent', async () => {
      const verifiedRoom = {
        id: 42,
        isVerified: true,
        deletedAt: null,
      };
      tx.room.findUnique.mockResolvedValue(verifiedRoom);

      await expect(service.setVerified('admin-1', 42, true)).resolves.toBe(
        verifiedRoom,
      );
      expect(tx.room.updateMany).not.toHaveBeenCalled();
      expect(tx.roomModeration.create).not.toHaveBeenCalled();
    });
  });
});
