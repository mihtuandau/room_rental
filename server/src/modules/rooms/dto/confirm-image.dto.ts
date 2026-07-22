import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class ConfirmImageDto {
  @ApiProperty({
    description:
      'Cloudinary public_id from the upload response — stored so the image can be destroyed later',
  })
  @IsString()
  key!: string;

  @ApiProperty({
    description: 'Cloudinary secure_url from the upload response',
  })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}
