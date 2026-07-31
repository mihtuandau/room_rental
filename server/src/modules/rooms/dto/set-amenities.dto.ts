import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsPositive,
} from 'class-validator';

export class SetAmenitiesDto {
  @ApiProperty({
    type: [Number],
    description: "Replaces the listing's full amenity set",
  })
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  amenityIds!: number[];
}
