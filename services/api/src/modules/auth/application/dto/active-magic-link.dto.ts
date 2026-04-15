import { IsNotEmpty, IsString } from 'class-validator';

export class ActiveMagicLinkDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
