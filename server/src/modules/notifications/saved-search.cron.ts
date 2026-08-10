import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { RoomStatus } from '../../../generated/prisma/client';
import { SAVED_SEARCH_QUEUE } from './notifications.service';

@Injectable()
export class SavedSearchCron {
  private readonly logger = new Logger(SavedSearchCron.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(SAVED_SEARCH_QUEUE) private queue: Queue,
  ) {}

  // Safety net — catches anything the event-driven trigger missed (e.g. a
  // transient Redis outage when the room was first approved).
  @Cron(CronExpression.EVERY_HOUR)
  async scanRecentActiveRooms() {
    const rooms = await this.prisma.room.findMany({
      where: {
        status: RoomStatus.active,
        deletedAt: null,
        owner: { is: { deletedAt: null } },
        // Cover outages longer than one scheduling interval. NotificationLog
        // makes the replay idempotent, so a wider recovery window is safe.
        publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) },
      },
      select: { id: true },
    });

    for (const room of rooms) {
      try {
        await this.queue.add(
          'match-room',
          { roomId: room.id },
          {
            jobId: `match-room:${room.id}:${Math.floor(Date.now() / 3_600_000)}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: { age: 86_400, count: 1_000 },
            removeOnFail: { age: 7 * 86_400, count: 1_000 },
          },
        );
      } catch (err) {
        this.logger.error(
          `Cron failed to enqueue room ${room.id}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }
  }
}
