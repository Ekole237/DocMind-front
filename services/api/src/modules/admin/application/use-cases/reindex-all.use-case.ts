import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '#admin/domain/repositories/document.repository';
import {
  VECTOR_STORE_SERVICE,
  type VectorStoreService,
} from '#admin/domain/services/vector-store.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ReindexAllUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly _documentRepository: DocumentRepository,
    @Inject(VECTOR_STORE_SERVICE)
    private readonly _vectorStoreService: VectorStoreService,
  ) {}

  async execute() {
    const documents = await this._documentRepository.listDocuments();
    await this._vectorStoreService.indexAllDocuments(documents);
  }
}
