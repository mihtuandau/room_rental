import { IsString, Length } from 'class-validator';

export class DeleteUnconfirmedImageDto {
  @IsString()
  @Length(1, 255)
  publicId!: string;
}
