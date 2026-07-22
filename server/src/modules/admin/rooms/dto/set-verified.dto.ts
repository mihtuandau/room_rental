import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetVerifiedDto {
  @ApiProperty()
  @IsBoolean()
  isVerified!: boolean;
}
