import { DocumentEntity } from '../entities/document.entity';

export const VECTOR_STORE_SERVICE = Symbol('VECTOR_STORE_SERVICE');

export interface VectorStoreService {
  indexDocument(document: DocumentEntity): Promise<number>;
  removeChunkByDocumentId(documentId: string): Promise<void>;
  indexAllDocuments(documents: DocumentEntity[]): Promise<void>;
}
