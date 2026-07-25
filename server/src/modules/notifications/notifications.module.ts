import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';
import { SavedSearchCron } from './saved-search.cron';

@Module({
  imports: [BullModule.registerQueue({ name: 'saved-search-notifications' })],
  controllers: [NotificationsController],
  providers: [NotificationsProcessor, NotificationsService, SavedSearchCron],
  exports: [NotificationsService],
})
export class NotificationsModule {}
