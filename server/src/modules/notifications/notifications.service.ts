import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType } from '../../../generated/prisma/client';

export const SAVED_SEARCH_QUEUE = 'saved-search-notifications';

const NOTIFICATIONS_PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(SAVED_SEARCH_QUEUE) private queue: Queue,
    private prisma: PrismaService,
  ) {}

  // Event-driven trigger — called right after a room is approved to "active".
  // Never let a queue/Redis outage break the admin approval flow: enqueueing
  // is best-effort, the hourly cron (see SavedSearchCron) is the safety net.
  async onRoomApproved(roomId: number) {
    try {
      await this.queue.add(
        'match-room',
        { roomId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    } catch (err) {
      this.logger.error(
        `Failed to enqueue notification job for room ${roomId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  /** The one place a Notification row gets written — every trigger below calls this. */
  async create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    roomId?: number;
  }) {
    return this.prisma.notification.create({ data: input });
  }

  async createSavedSearchMatchOnce(input: {
    savedSearchId: string;
    userId: string;
    roomId: number;
    roomTitle: string;
  }) {
    try {
      await this.prisma.$transaction([
        this.prisma.notificationLog.create({
          data: {
            savedSearchId: input.savedSearchId,
            roomId: input.roomId,
          },
        }),
        this.prisma.notification.create({
          data: {
            userId: input.userId,
            type: NotificationType.saved_search_match,
            title: 'Có tin đăng mới phù hợp',
            body: `"${input.roomTitle}" khớp với tìm kiếm đã lưu của bạn.`,
            roomId: input.roomId,
          },
        }),
      ]);
      return true;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  async notifyListingApproved(room: {
    ownerId: string;
    id: number;
    title: string;
  }) {
    try {
      await this.create({
        userId: room.ownerId,
        type: NotificationType.listing_approved,
        title: 'Tin đăng đã được duyệt',
        body: `Tin "${room.title}" của bạn đang hiển thị công khai.`,
        roomId: room.id,
      });
    } catch (err) {
      this.logger.error(
        `Failed to create approval notification for room ${room.id}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  async notifyListingRejected(
    room: { ownerId: string; id: number; title: string },
    note?: string,
  ) {
    try {
      await this.create({
        userId: room.ownerId,
        type: NotificationType.listing_rejected,
        title: 'Tin đăng bị từ chối',
        body: note
          ? `Tin "${room.title}" của bạn bị từ chối: ${note}`
          : `Tin "${room.title}" của bạn không được duyệt.`,
        roomId: room.id,
      });
    } catch (err) {
      this.logger.error(
        `Failed to create rejection notification for room ${room.id}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  async findMine(userId: string, page = 1, pageSize = NOTIFICATIONS_PAGE_SIZE) {
    const where = { userId };
    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { room: { select: { slug: true } } },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { notifications, total, page, pageSize, unreadCount };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification not found.');
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this notification.',
      );
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
