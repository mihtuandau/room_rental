import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VN_PHONE_REGEX } from '@/common/constants/phone.constant';

export class RegisterDto {
  @ApiProperty({ example: '0912345678' })
  @IsString()
  @Matches(VN_PHONE_REGEX, { message: 'Invalid Vietnamese phone number.' })
  phone!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;
}
