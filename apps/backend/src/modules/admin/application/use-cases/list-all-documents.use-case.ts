import { DocumentEntity } from '#admin/domain/entities/document.entity';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '#admin/domain/repositories/document.repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ListAllDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private documentRepository: DocumentRepository,
  ) {}

  async execute(): Promise<DocumentEntity[]> {
    return await this.documentRepository.listDocuments();
  }
}
