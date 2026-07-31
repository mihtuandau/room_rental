import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { CloudinaryService } from './cloudinary.service';
import { StorageService } from './storage.service';

@Module({
  controllers: [StorageController],
  providers: [CloudinaryService, StorageService],
  exports: [CloudinaryService], // RoomsModule reuses this to destroy assets when an image is removed
})
export class StorageModule {}
