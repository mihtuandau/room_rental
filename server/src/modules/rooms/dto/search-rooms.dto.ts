import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RoomType } from '../../../../generated/prisma/client';

const SORT_VALUES = ['newest', 'price_asc', 'price_desc'] as const;
type SortValue = (typeof SORT_VALUES)[number];

export class SearchRoomsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional({ enum: RoomType })
  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMin?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  areaMin?: number;

  @ApiPropertyOptional({
    type: String,
    description:
      'Comma-separated amenity ids — listings must have ALL of them (e.g. "1,3,5")',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    String(value)
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => !Number.isNaN(n)),
  )
  @IsInt({ each: true })
  amenityIds?: number[];

  @ApiPropertyOptional({ enum: SORT_VALUES, default: 'newest' })
  @IsOptional()
  @IsEnum(SORT_VALUES)
  sort?: SortValue = 'newest';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
