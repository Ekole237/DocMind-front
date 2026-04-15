import { DocumentEntity } from '#admin/domain/entities/document.entity';
import { DocumentNotFound } from '#admin/domain/exceptions/document-not-found';
import {
  ClassifyDocument,
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '#admin/domain/repositories/document.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ClassifyDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly _documentRepository: DocumentRepository,
  ) {}

  async execute(id: string, dto: ClassifyDocument): Promise<DocumentEntity> {
    const doc = await this._documentRepository.findById(id);

    if (!doc) {
      throw new DocumentNotFound();
    }

    return await this._documentRepository.classifyDocument(id, dto);
  }
}
