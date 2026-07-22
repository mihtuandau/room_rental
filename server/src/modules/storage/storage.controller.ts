import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CloudinaryService } from './cloudinary.service';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('presign/room-image')
  @ApiOperation({
    summary: 'Get signed params to upload a room image directly to Cloudinary',
  })
  presignRoomImage() {
    return this.cloudinaryService.createUploadSignature('rooms');
  }

  @Post('presign/avatar')
  @ApiOperation({
    summary: 'Get signed params to upload an avatar directly to Cloudinary',
  })
  presignAvatar() {
    return this.cloudinaryService.createUploadSignature('avatars');
  }
}
