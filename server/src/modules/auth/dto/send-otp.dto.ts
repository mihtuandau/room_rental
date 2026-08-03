import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { OtpPurpose } from '../../../../generated/prisma/client';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';

export class SendOtpDto {
  @ApiProperty({ required: false, example: '0912345678' })
  @ValidateIf((o) => !o.email)
  @IsString()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone?: string;

  @ApiProperty({ required: false, example: 'you@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address.' })
  email?: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
