import { DocumentEntity } from '#admin/domain/entities/document.entity';
import { DocumentStatus } from '#admin/domain/enums/document-status';
import { DocumentNotFound } from '#admin/domain/exceptions/document-not-found';
import { DocumentNotIndexed } from '#admin/domain/exceptions/document-not-indexed';
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
export class DisableDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly _documentRepository: DocumentRepository,
    @Inject(VECTOR_STORE_SERVICE)
    private readonly _vectorStoreService: VectorStoreService,
  ) {}

  async execute(id: string): Promise<DocumentEntity> {
    const document = await this._documentRepository.findById(id);

    if (!document) {
      throw new DocumentNotFound();
    }

    if (document.status !== DocumentStatus.INDEXED) {
      throw new DocumentNotIndexed();
    }

    await this._vectorStoreService.removeChunkByDocumentId(id);

    return await this._documentRepository.disableDocument(id);
  }
}
