import { Module } from '@nestjs/common';
import { ContactLogsController } from './contact-logs.controller';
import { ContactLogsService } from './contact-logs.service';

@Module({
  controllers: [ContactLogsController],
  providers: [ContactLogsService],
})
export class ContactLogsModule {}
