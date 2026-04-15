import { IsUUID } from 'class-validator';

export class ActiveGuestTokenDto {
  @IsUUID()
  token: string;
}
