import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSavedSearchDto {
  @ApiPropertyOptional({ description: 'Whether matching listings create notifications' })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
}
