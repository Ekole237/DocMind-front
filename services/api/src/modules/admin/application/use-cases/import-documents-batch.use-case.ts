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

export interface ImportDocumentsBatchDto {
  confidentiality: Confidentiality;
}

@Injectable()
export class ImportDocumentsBatchUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly _documentRepository: DocumentRepository,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: FileStorageService,
  ) {}

  async execute(
    dto: ImportDocumentsBatchDto,
    files: UploadedFile[],
  ): Promise<DocumentEntity[]> {
    const saved = await Promise.all(
      files.map((file) => this._fileStorageService.save(file)),
    );

    const documents = await this._documentRepository.createDocuments(
      files.map((file, i) => ({
        title: file.originalName.replace(/\.(pdf|docx|doc|txt)$/i, ''),
        confidentiality: dto.confidentiality,
        filePath: saved[i],
        mimeType: file.mimeType,
      })),
    );

    return documents;
  }
}
