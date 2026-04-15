import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class QueryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  question: string;

  @IsUUID()
  @IsOptional()
  context_id?: string;
}
