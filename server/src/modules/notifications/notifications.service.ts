import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const SAVED_SEARCH_QUEUE = 'saved-search-notifications';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectQueue(SAVED_SEARCH_QUEUE) private queue: Queue) {}

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
}
