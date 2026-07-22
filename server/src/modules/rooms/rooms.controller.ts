import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { ConfirmImageDto } from './dto/confirm-image.dto';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({
    summary: 'Public room search / listing (verified-first, paginated)',
  })
  search(@Query() query: SearchRoomsDto) {
    return this.roomsService.search(query);
  }

  // Must come before ":slug" — otherwise "mine" would be parsed as a slug.
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List the current landlord's own listings (any status)",
  })
  findMine(@CurrentUser('id') userId: string) {
    return this.roomsService.findMine(userId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Public listing detail by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.roomsService.findActiveBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Landlord creates a new listing (status: pending)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Landlord edits their own listing' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(userId, Number(id), dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Landlord soft-deletes their own listing' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.roomsService.softDelete(userId, Number(id));
  }

  @Post(':id/images/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Persist an image after it has been uploaded directly to Cloudinary',
  })
  confirmImage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmImageDto,
  ) {
    return this.roomsService.addImage(userId, Number(id), dto);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a room image (DB record + underlying Cloudinary asset)',
  })
  removeImage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.roomsService.removeImage(userId, Number(id), imageId);
  }
}
