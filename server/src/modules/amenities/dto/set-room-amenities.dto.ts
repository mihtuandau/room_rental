import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt } from 'class-validator';

export class SetRoomAmenitiesDto {
  @ApiProperty({
    type: [Number],
    description: 'Complete desired set — replaces any previous assignment',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @Type(() => Number)
  @IsInt({ each: true })
  amenityIds!: number[];
}
