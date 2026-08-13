import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { StorageService } from './storage.service';
import { DeleteUnconfirmedImageDto } from './dto/delete-unconfirmed-image.dto';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign/room-image/:roomId')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Get signed params to upload a room image directly to Cloudinary',
  })
  presignRoomImage(
    @CurrentUser('id') userId: string,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.storageService.createRoomImageSignature(userId, roomId);
  }

  @Post('presign/avatar')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Get signed params to upload an avatar directly to Cloudinary',
  })
  presignAvatar(@CurrentUser('id') userId: string) {
    return this.storageService.createAvatarSignature(userId);
  }

  @Delete('room-image/:roomId/unconfirmed')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Delete an uploaded room image that was not confirmed',
  })
  deleteUnconfirmedRoomImage(
    @CurrentUser('id') userId: string,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() dto: DeleteUnconfirmedImageDto,
  ) {
    return this.storageService.deleteUnconfirmedRoomImage(
      userId,
      roomId,
      dto.publicId,
    );
  }
}
