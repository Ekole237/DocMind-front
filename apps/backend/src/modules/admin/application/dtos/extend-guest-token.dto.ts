import { Type } from 'class-transformer';
import { IsDate, MinDate } from 'class-validator';

export class ExtendGuestTokenDto {
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date())
  expiresAt: Date;
}
