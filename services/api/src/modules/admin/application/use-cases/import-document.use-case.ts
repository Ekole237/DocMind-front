import { DocumentEntity } from '#admin/domain/entities/document.entity';
import { Confidentiality } from '#admin/domain/enums/confidentiality';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '#admin/domain/repositories/document.repository';
import {
  FILE_STORAGE_SERVICE,
  type FileStorageService,
  type UploadedFile,
} from '#admin/domain/services/file-storage.service';
import { Inject, Injectable } from '@nestjs/common';

export interface ImportDocumentDto {
  title: string;
  confidentiality: Confidentiality;
}

@Injectable()
export class ImportDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly _documentRepository: DocumentRepository,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: FileStorageService,
  ) {}

  async execute(
    dto: ImportDocumentDto,
    file: UploadedFile,
  ): Promise<DocumentEntity> {
    const filePath = await this._fileStorageService.save(file);

    return this._documentRepository.createDocument({
      title: dto.title,
      confidentiality: dto.confidentiality,
      filePath,
      mimeType: file.mimeType,
    });
  }
}
