import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';
import { STRONG_PASSWORD_REGEX } from '@/common/constants/password.constant';

export class RegisterDto {
  @ApiProperty({ required: false, example: '0912345678' })
  @ValidateIf((o) => !o.email)
  @IsString()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone?: string;

  @ApiProperty({ required: false, example: 'you@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address.' })
  email?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(STRONG_PASSWORD_REGEX, { message: 'Password must include uppercase, lowercase, and a number.' })
  password!: string;

  @ApiProperty({
    example: '123456',
    description: 'Single-use OTP sent for the register purpose',
  })
  @IsNumberString()
  @Length(6, 6)
  otpCode!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;
}
