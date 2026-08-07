import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, Matches } from 'class-validator';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';
import { OtpPurpose } from '../../../../generated/prisma/client';

export class SendOtpDto {
  @ApiProperty({ example: 'you@example.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address.' })
  email?: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone?: string;

  @ApiProperty({ enum: OtpPurpose })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
