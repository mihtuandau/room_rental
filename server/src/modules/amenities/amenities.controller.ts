import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AmenitiesService } from './amenities.service';
import { SetRoomAmenitiesDto } from './dto/set-room-amenities.dto';

@ApiTags('amenities')
@Controller()
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get('amenities')
  @ApiOperation({
    summary: 'Public amenity catalog (for search filters and the listing form)',
  })
  list() {
    return this.amenitiesService.list();
  }

  // PUT (not PATCH): the body is the complete replacement set, true PUT semantics.
  @Put('rooms/:id/amenities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Replace a listing's amenity set (landlord, ownership-checked)",
  })
  setForRoom(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SetRoomAmenitiesDto,
  ) {
    return this.amenitiesService.setForRoom(userId, Number(id), dto.amenityIds);
  }
}
