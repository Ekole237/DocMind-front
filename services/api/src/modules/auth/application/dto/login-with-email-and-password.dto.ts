import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginWithEmailAndPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  _hp?: string;
}
