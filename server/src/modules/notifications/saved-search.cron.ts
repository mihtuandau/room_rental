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
        publishedAt: { gte: new Date(Date.now() - 60 * 60_000) },
      },
      select: { id: true },
    });

    for (const room of rooms) {
      try {
        await this.queue.add(
          'match-room',
          { roomId: room.id },
          { attempts: 3 },
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
