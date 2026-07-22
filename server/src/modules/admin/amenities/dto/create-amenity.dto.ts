import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { AmenityType } from '../../../../../generated/prisma/client';

export class CreateAmenityDto {
  @ApiProperty({ example: 'WiFi' })
  @IsString()
  @Length(1, 50)
  name!: string;

  @ApiProperty({ enum: AmenityType })
  @IsEnum(AmenityType)
  type!: AmenityType;

  @ApiPropertyOptional({ description: 'Icon name/emoji the frontend renders' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  icon?: string;
}

export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {}
