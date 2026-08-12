import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { STRONG_PASSWORD_REGEX } from '@/common/constants/password.constant';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';

export class ResetPasswordDto {
  @ApiProperty({ example: 'you@example.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address.' })
  email?: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone?: string;

  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(STRONG_PASSWORD_REGEX, {
    message: 'Password must include uppercase, lowercase, and a number.',
  })
  newPassword!: string;
}
