export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  source: string;
  title: string;
  lastModified: Date;
  chunkIndex: number;
  driveUrl: string | null;
  confidenceScore: number;
}

export const VECTOR_SEARCH_SERVICE = Symbol('VectorSearchService');

export interface VectorSearchService {
  searchChunks(
    question: string,
    roleLevel: number,
    limit: number,
    threshold: number,
  ): Promise<DocumentChunk[]>;
}
