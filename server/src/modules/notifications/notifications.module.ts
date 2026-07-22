import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';
import { SavedSearchCron } from './saved-search.cron';

@Module({
  imports: [BullModule.registerQueue({ name: 'saved-search-notifications' })],
  providers: [NotificationsProcessor, NotificationsService, SavedSearchCron],
  exports: [NotificationsService],
})
export class NotificationsModule {}
