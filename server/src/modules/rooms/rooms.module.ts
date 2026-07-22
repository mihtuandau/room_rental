import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [StorageModule], // reuses S3Service to delete objects when an image is removed
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
