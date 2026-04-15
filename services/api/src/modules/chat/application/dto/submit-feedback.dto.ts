import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SubmitFeedbackDto {
  @IsUUID()
  queryLogId: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}
