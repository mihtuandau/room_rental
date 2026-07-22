import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { RoomStatus } from '../../../generated/prisma/client';
import { SAVED_SEARCH_QUEUE } from './notifications.service';

interface MatchRoomJobData {
  roomId: number;
}

@Processor(SAVED_SEARCH_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<MatchRoomJobData>) {
    const room = await this.prisma.room.findUnique({
      where: { id: job.data.roomId },
    });
    if (!room || room.status !== RoomStatus.active || room.deletedAt) return;

    const matches = await this.prisma.savedSearch.findMany({
      where: {
        AND: [
          { OR: [{ city: null }, { city: room.city }] },
          { OR: [{ district: null }, { district: room.district }] },
          { OR: [{ roomType: null }, { roomType: room.roomType }] },
          { OR: [{ priceMin: null }, { priceMin: { lte: room.price } }] },
          { OR: [{ priceMax: null }, { priceMax: { gte: room.price } }] },
          ...(room.area != null
            ? [{ OR: [{ areaMin: null }, { areaMin: { lte: room.area } }] }]
            : []),
          ...(room.area != null
            ? [{ OR: [{ areaMax: null }, { areaMax: { gte: room.area } }] }]
            : []),
        ],
      },
      include: { user: { select: { id: true, phone: true } } },
    });

    for (const search of matches) {
      // idempotent: unique constraint on [savedSearchId, roomId] blocks duplicate
      // sends across retries/cron re-scans — skip silently if already notified.
      try {
        await this.prisma.notificationLog.create({
          data: { savedSearchId: search.id, roomId: room.id },
        });
      } catch {
        continue;
      }

      try {
        await this.sendNotification(search.user, room);
        await this.prisma.savedSearch.update({
          where: { id: search.id },
          data: { lastNotifiedAt: new Date() },
        });
      } catch (err) {
        // one user's delivery failure must never fail the whole job
        this.logger.error(
          `Failed to notify user ${search.user.id} for room ${room.id}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }
  }

  private async sendNotification(
    user: { phone: string },
    room: { title: string; slug: string },
  ) {
    // TODO: wire up a real SMS/push provider — placeholder keeps the job flow testable.
    this.logger.log(
      `[DEV ONLY] Notify ${user.phone}: new listing matches your saved search — "${room.title}" (${room.slug})`,
    );
    await Promise.resolve();
  }
}
