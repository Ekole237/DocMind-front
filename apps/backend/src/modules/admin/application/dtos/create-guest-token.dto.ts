import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinDate,
} from 'class-validator';

export class CreateGuestTokenDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Type(() => Date)
  @IsDate()
  @MinDate(new Date())
  @IsNotEmpty()
  expiresAt: Date;
}
