import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';

export class SendContactPhoneOtpDto {
  @ApiProperty({ example: '0912345678' })
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone!: string;
}
