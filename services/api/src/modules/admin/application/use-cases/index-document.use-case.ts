import { DocumentStatus } from '#admin/domain/enums/document-status';
import { DocumentNotFound } from '#admin/domain/exceptions/document-not-found';
import { IndexingError } from '#admin/domain/exceptions/indexing-error';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '#admin/domain/repositories/document.repository';
import {
  VECTOR_STORE_SERVICE,
  VectorStoreService,
} from '#admin/domain/services/vector-store.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class IndexDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly _documentRepository: DocumentRepository,
    @Inject(VECTOR_STORE_SERVICE)
    private readonly _vectorStoreService: VectorStoreService,
  ) {}

  async execute(id: string) {
    const record = await this._documentRepository.findById(id);

    if (!record) {
      throw new DocumentNotFound();
    }

    if (record.status === DocumentStatus.INDEXED) {
      throw new IndexingError('Document already indexed');
    }

    const chunkCount = await this._vectorStoreService.indexDocument(record);

    if (chunkCount === 0) {
      throw new IndexingError('Document not indexed');
    }

    await this._documentRepository.updateDocumentStatus(
      id,
      DocumentStatus.INDEXED,
    );

    await this._documentRepository.updateChunkCount(id, chunkCount);
  }
}
