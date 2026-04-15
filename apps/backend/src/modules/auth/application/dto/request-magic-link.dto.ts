import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RequestMagicLinkDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  _hp?: string;
}
