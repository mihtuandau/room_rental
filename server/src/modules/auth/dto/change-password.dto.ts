import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { STRONG_PASSWORD_REGEX } from '@/common/constants/password.constant';

export class ChangePasswordDto {
  @ApiProperty({ minLength: 8, description: 'Current account password' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword!: string;

  @ApiProperty({ minLength: 8, description: 'New account password' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(STRONG_PASSWORD_REGEX, {
    message: 'Password must include uppercase, lowercase, and a number.',
  })
  newPassword!: string;
}
