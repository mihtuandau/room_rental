import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
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
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { ConfirmImageDto } from './dto/confirm-image.dto';
import { SetAmenitiesDto } from './dto/set-amenities.dto';
import { RecordRoomViewDto } from './dto/record-room-view.dto';
import { FeaturedLocationsQueryDto } from './dto/featured-locations-query.dto';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=15, stale-while-revalidate=30')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Public room search / listing (verified-first, paginated)',
  })
  search(@Query() query: SearchRoomsDto) {
    return this.roomsService.search(query);
  }

  @Get('featured-locations')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({
    summary: 'List public areas ranked by active listing count',
  })
  featuredLocations(@Query() query: FeaturedLocationsQueryDto) {
    return this.roomsService.featuredLocations(query.limit);
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
  findMineDetail(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.roomsService.findMineDetail(userId, id);
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=15, stale-while-revalidate=30')
  @ApiOperation({ summary: 'Public listing detail by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.roomsService.findActiveBySlug(slug);
  }

  @Post(':id/view')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Record one deduplicated anonymous browser view for a listing',
  })
  recordView(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordRoomViewDto,
  ) {
    return this.roomsService.recordView(id, dto.visitorId);
  }

  // Deliberately not role-restricted: in practice the same person both rents
  // and lets out rooms, so any signed-in user may post. `role` only drives UI
  // (and still strictly gates admin endpoints); ownership is what protects a
  // listing, and every new listing still waits for admin approval.
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete your own listing' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.roomsService.softDelete(userId, id);
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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmImageDto,
  ) {
    return this.roomsService.addImage(userId, id, dto);
  }

  @Patch(':id/images/:imageId/cover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set one of your room images as the cover image' })
  @ApiOkResponse({ description: 'The selected image is now the room cover' })
  setCoverImage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId') imageId: string,
  ) {
    return this.roomsService.setCoverImage(userId, id, imageId);
  }

  @Put(':id/amenities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Replace a listing's amenity set" })
  setAmenities(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetAmenitiesDto,
  ) {
    return this.roomsService.setAmenities(userId, id, dto.amenityIds);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a room image (DB record + underlying Cloudinary asset)',
  })
  removeImage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId') imageId: string,
  ) {
    return this.roomsService.removeImage(userId, id, imageId);
  }
}
