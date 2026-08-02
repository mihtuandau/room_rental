import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { RoomStatus } from '../../../generated/prisma/client';
import {
  NotificationsService,
  SAVED_SEARCH_QUEUE,
} from './notifications.service';

interface MatchRoomJobData {
  roomId: number;
}

const RECIPIENT_BATCH_SIZE = 5;

@Processor(SAVED_SEARCH_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
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

    let transientFailure: unknown;
    for (
      let offset = 0;
      offset < matches.length;
      offset += RECIPIENT_BATCH_SIZE
    ) {
      const batch = matches.slice(offset, offset + RECIPIENT_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (search) => {
          const created =
            await this.notificationsService.createSavedSearchMatchOnce({
              savedSearchId: search.id,
              userId: search.user.id,
              roomId: room.id,
              roomTitle: room.title,
            });
          if (!created) return;

          // SMS is an optional channel. A provider failure must not roll back
          // the durable in-app notification or make a retry duplicate it.
          if (search.user.phone) {
            try {
              await this.sendNotification({ id: search.user.id }, room);
            } catch (error) {
              this.logger.error(
                `Failed to send optional notification for user ${search.user.id}, room ${room.id}`,
                error instanceof Error ? error.stack : error,
              );
            }
          }

          await this.prisma.savedSearch.update({
            where: { id: search.id },
            data: { lastNotifiedAt: new Date() },
          });
        }),
      );

      for (const result of results) {
        if (result.status === 'rejected') {
          transientFailure ??= result.reason;
          this.logger.error(
            `Failed to persist a saved-search notification for room ${room.id}`,
            result.reason instanceof Error
              ? result.reason.stack
              : result.reason,
          );
        }
      }
    }

    // BullMQ retries transient database failures. Recipients already completed
    // are skipped by the unique notification log on the next run.
    if (transientFailure) throw transientFailure;
  }

  private async sendNotification(
    user: { id: string },
    room: { title: string; slug: string },
  ) {
    // TODO: wire up a real SMS/push provider. This placeholder keeps the
    // delivery path testable without logging the user's phone number.
    this.logger.log(
      `[DEV ONLY] Notification queued for user ${user.id}, room ${room.slug}.`,
    );
    await Promise.resolve();
  }
}
