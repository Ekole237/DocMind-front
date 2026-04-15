import { Confidentiality } from '#admin/domain/enums/confidentiality';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsEnum(Confidentiality)
  confidentiality: Confidentiality;

  @IsOptional()
  @IsUrl()
  driveUrl?: string | null;

  @IsOptional()
  @IsString()
  filePath?: string | null;

  @IsOptional()
  @IsString()
  mimeType?: string | null;
}
