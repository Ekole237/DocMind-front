import {
  DocumentChunk,
  type VectorSearchService,
} from '#chat/domain/services/vector-search.service';
import {
  EMBEDDING_SERVICE,
  type EmbeddingService,
} from 'src/core/embedding/embedding.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantService } from 'src/qdrant/qdrant.service';

@Injectable()
export class VectorSearchServiceImplementation implements VectorSearchService {
  private readonly logger = new Logger(VectorSearchServiceImplementation.name);

  constructor(
    private readonly _qdrantService: QdrantService,
    private readonly _configService: ConfigService,
    @Inject(EMBEDDING_SERVICE)
    private readonly _embeddingService: EmbeddingService,
  ) {}

  async searchChunks(
    question: string,
    roleLevel: number,
    limit: number,
    threshold: number,
  ): Promise<DocumentChunk[]> {
    const vector = await this._embeddingService.embed(question);
    const results = await this._qdrantService.search(vector, roleLevel, limit, threshold);

    return results.map((r) => {
      const payload = r.payload as Record<string, any>;
      return {
        id: String(r.id),
        documentId: payload['document_id'] ?? '',
        content: payload['content'] ?? '',
        source: payload['source'] ?? '',
        title: payload['title'] ?? '',
        lastModified: new Date(payload['date'] ?? Date.now()),
        chunkIndex: payload['chunk_index'] ?? 0,
        driveUrl: payload['source'] ?? null,
        confidenceScore: r.score,
      };
    });
  }
}
