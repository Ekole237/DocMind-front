import { Confidentiality } from '#admin/domain/enums/confidentiality';
import { IsEnum } from 'class-validator';

export class ClassifyDocumentDto {
  @IsEnum(Confidentiality)
  confidentiality: Confidentiality;
}
