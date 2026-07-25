import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class SetAmenitiesDto {
  @ApiProperty({
    type: [Number],
    description: "Replaces the listing's full amenity set",
  })
  @IsInt({ each: true })
  amenityIds!: number[];
}
