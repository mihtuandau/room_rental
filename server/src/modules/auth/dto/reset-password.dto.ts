import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumberString,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';

export class ResetPasswordDto {
  @ApiProperty({ example: '0912345678' })
  @IsString()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsNumberString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
