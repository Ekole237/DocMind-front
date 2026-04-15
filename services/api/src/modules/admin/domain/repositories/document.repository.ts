import { DocumentEntity } from '#admin/domain/entities/document.entity';
import { Confidentiality } from '#admin/domain/enums/confidentiality';
import { DocumentStatus } from '#admin/domain/enums/document-status';

export const DOCUMENT_REPOSITORY = Symbol('DocumentRepository');

export interface CreateDocument {
  title: string;
  driveUrl?: string;
  filePath?: string;
  mimeType?: string;
  confidentiality: Confidentiality;
}

export interface ClassifyDocument {
  confidentiality: Confidentiality;
}

export interface DocumentRepository {
  listDocuments(): Promise<DocumentEntity[]>;
  createDocument(dto: CreateDocument): Promise<DocumentEntity>;
  findById(id: string): Promise<DocumentEntity | null>;
  classifyDocument(id: string, dto: ClassifyDocument): Promise<DocumentEntity>;
  disableDocument(id: string): Promise<DocumentEntity>;
  enableDocument(id: string): Promise<DocumentEntity>;
  deleteDocument(id: string): Promise<void>;
  updateDocumentStatus(
    id: string,
    status: DocumentStatus,
  ): Promise<DocumentEntity>;
  updateChunkCount(id: string, chunkCount: number): Promise<DocumentEntity>;
  countByStatus(status: DocumentStatus): Promise<number>;
}
