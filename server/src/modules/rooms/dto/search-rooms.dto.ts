import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  IsPositive,
  IsNumber,
} from 'class-validator';
import { RoomType } from '../../../../generated/prisma/client';

const SORT_VALUES = ['newest', 'price_asc', 'price_desc'] as const;
type SortValue = (typeof SORT_VALUES)[number];

export class SearchRoomsDto {
  @ApiPropertyOptional({
    description: 'Free-text search over title/description, accent-insensitive',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Legacy province-name snapshot; prefer provinceCode.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Current province code.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  provinceCode?: number;

  @ApiPropertyOptional({
    description:
      'Historical district label; not a current administrative filter.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  district?: string;
  @ApiPropertyOptional({
    description:
      'Ward/commune (phường/xã) — a finer-grained filter than district',
  })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({
    description: 'Current ward/commune/special-zone code.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wardCode?: number;
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
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  areaMin?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  areaMax?: number;

  @ApiPropertyOptional({
    description: 'Latitude of the search center for radius search',
    example: 16.0544,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude of the search center for radius search',
    example: 108.2022,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    description: 'Radius in kilometers around lat/lng',
    default: 3,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  radiusKm?: number;

  @ApiPropertyOptional({
    description:
      'Only return verified listings (still ranked verified-first either way)',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({
    type: String,
    description:
      'Comma-separated amenity ids — listings must have ALL of them (e.g. "1,3,5")',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    String(value)
      .split(',')
      .map((v) => Number(v.trim())),
  )
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
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
  @Max(10_000)
  page?: number = 1;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}
