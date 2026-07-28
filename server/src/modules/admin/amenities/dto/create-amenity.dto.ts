import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {}
