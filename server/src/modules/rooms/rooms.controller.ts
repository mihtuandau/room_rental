import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { ConfirmImageDto } from './dto/confirm-image.dto';
import { SetAmenitiesDto } from './dto/set-amenities.dto';

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
    summary: "List the current user's own listings (any status)",
  })
  findMine(@CurrentUser('id') userId: string) {
    return this.roomsService.findMine(userId);
  }

  // Also before ":slug" (this has an extra segment so it wouldn't actually
  // collide, but keeping every /mine route grouped together here).
  @Get('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Full detail of one of your own listings, any status — for editing',
  })
  findMineDetail(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.roomsService.findMineDetail(userId, Number(id));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Public listing detail by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.roomsService.findActiveBySlug(slug);
  }

  // Deliberately not role-restricted: in practice the same person both rents
  // and lets out rooms, so any signed-in user may post. `role` only drives UI
  // (and still strictly gates admin endpoints); ownership is what protects a
  // listing, and every new listing still waits for admin approval.
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing (status: pending)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit your own listing' })
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
  @ApiOperation({ summary: 'Soft-delete your own listing' })
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

  @Patch(':id/images/:imageId/cover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set one of your room images as the cover image' })
  @ApiOkResponse({ description: 'The selected image is now the room cover' })
  setCoverImage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.roomsService.setCoverImage(userId, Number(id), imageId);
  }

  @Put(':id/amenities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Replace a listing's amenity set" })
  setAmenities(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SetAmenitiesDto,
  ) {
    return this.roomsService.setAmenities(userId, Number(id), dto.amenityIds);
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
