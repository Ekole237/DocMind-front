import { DocumentNotFound } from '#admin/domain/exceptions/document-not-found';
import {
  DOCUMENT_REPOSITORY,
  DocumentRepository,
} from '#admin/domain/repositories/document.repository';
import {
  FILE_STORAGE_SERVICE,
  FileStorageService,
} from '#admin/domain/services/file-storage.service';
import {
  VECTOR_STORE_SERVICE,
  VectorStoreService,
} from '#admin/domain/services/vector-store.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly _documentRepository: DocumentRepository,
    @Inject(VECTOR_STORE_SERVICE)
    private readonly _vectorStoreService: VectorStoreService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly _fileStorageService: FileStorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const record = await this._documentRepository.findById(id);

    if (!record) {
      throw new DocumentNotFound();
    }

    await this._vectorStoreService.removeChunkByDocumentId(id);

    if (record.filePath) {
      await this._fileStorageService.delete(record.filePath);
    }

    await this._documentRepository.deleteDocument(id);
  }
}
