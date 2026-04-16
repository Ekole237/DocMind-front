import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient, type Schemas } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService implements OnModuleInit {
  private client!: QdrantClient;
  private readonly logger = new Logger(QdrantService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.client = new QdrantClient({
      url: this.config.get<string>('QDRANT_URL', 'http://localhost:6333'),
    });

    const collection = this.config.get<string>(
      'QDRANT_COLLECTION',
      'rh_documents',
    );

    const { exists } = await this.client.collectionExists(collection);
    if (!exists) {
      const dimensions = parseInt(
        this.config.get<string>('EMBEDDING_DIMENSIONS', '384'),
        10,
      );
      const qdrantUrl = this.config.get<string>(
        'QDRANT_URL',
        'http://localhost:6333',
      );

      const response = await fetch(`${qdrantUrl}/collections/${collection}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vectors: { size: dimensions, distance: 'Cosine' },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to create Qdrant collection: ${body}`);
      }

      this.logger.log(
        `Collection "${collection}" created (dimensions: ${dimensions})`,
      );
    }
  }

  async search(
    vector: number[],
    roleLevel: number,
    topK: number,
    threshold: number,
  ) {
    const collection = this.config.get<string>(
      'QDRANT_COLLECTION',
      'rh_documents',
    );
    try {
      return await this.client.search(collection, {
        vector,
        limit: topK,
        score_threshold: threshold,
        filter: {
          must: [
            {
              key: 'role_required',
              range: { lte: roleLevel },
            },
          ],
        },
        with_payload: true,
      });
    } catch (err) {
      this.logger.error('Qdrant search failed', err);
      return [];
    }
  }

  async upsert(collectionName: string, points: Schemas['PointStruct'][]) {
    return this.client.upsert(collectionName, { points });
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    const collection = this.config.get<string>(
      'QDRANT_COLLECTION',
      'rh_documents',
    );

    try {
      await this.client.delete(collection, {
        filter: {
          must: [{ key: 'document_id', match: { value: documentId } }],
        },
      });
    } catch (err) {
      this.logger.error('Qdrant delete failed', err);
      throw err;
    }
  }
}
