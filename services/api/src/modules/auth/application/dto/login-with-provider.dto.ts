import { IsNotEmpty, IsString } from 'class-validator';

export class LoginWithProviderDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
