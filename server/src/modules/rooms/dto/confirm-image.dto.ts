import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class ConfirmImageDto {
  @ApiProperty({
    description:
      'Cloudinary public_id from the upload response — stored so the image can be destroyed later',
  })
  @IsString()
  @Length(10, 255)
  @Matches(/^rooms\/[A-Za-z0-9_-]+\/\d+\/[A-Za-z0-9_-]+$/)
  key!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}
