import { DocumentEntity } from '#admin/domain/entities/document.entity';
import { IndexingError } from '#admin/domain/exceptions/indexing-error';
import { InvalidDocument } from '#admin/domain/exceptions/invalid-document';
import { InvalidFormat } from '#admin/domain/exceptions/invalid-format';
import { type VectorStoreService } from '#admin/domain/services/vector-store.service';
import {
  EMBEDDING_SERVICE,
  type EmbeddingService,
} from 'src/core/embedding/embedding.service';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { QdrantService } from 'src/qdrant/qdrant.service';

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 50;
const ROLE_REQUIRED = 0;

@Injectable()
export class VectorStoreServiceImplementation implements VectorStoreService {
  private readonly logger = new Logger(VectorStoreServiceImplementation.name);

  constructor(
    private readonly _qdrantService: QdrantService,
    private readonly _configService: ConfigService,
    @Inject(EMBEDDING_SERVICE)
    private readonly _embeddingService: EmbeddingService,
  ) {}

  async indexDocument(document: DocumentEntity): Promise<number> {
    const text = await this._extractText(document);

    if (!text || text.trim().length === 0) {
      throw new IndexingError('No text could be extracted from the document.');
    }

    const chunks = this._chunkText(text);

    if (chunks.length === 0) {
      throw new IndexingError('Document produced no chunks after splitting.');
    }

    const points = await this._embedChunks(chunks, document);

    const collection = this._configService.get<string>('QDRANT_COLLECTION', 'rh_documents');
    await this._qdrantService.upsert(collection, points);

    return chunks.length;
  }

  async removeChunkByDocumentId(documentId: string): Promise<void> {
    await this._qdrantService.deleteByDocumentId(documentId);
  }

  async indexAllDocuments(documents: DocumentEntity[]): Promise<void> {
    for (const document of documents) {
      try {
        await this.indexDocument(document);
      } catch (err) {
        this.logger.error(`Failed to reindex document ${document.id}`, err);
      }
    }
  }

  // --- private ---

  private async _extractText(document: DocumentEntity): Promise<string> {
    if (!document.filePath) {
      throw new InvalidDocument('No local file path available for this document.');
    }

    const buffer = await fs.readFile(document.filePath);
    const mimeType = document.mimeType ?? '';

    if (mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (mimeType === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new InvalidFormat(`Unsupported MIME type: ${mimeType}`);
  }

  private _chunkText(text: string): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + CHUNK_SIZE, words.length);
      chunks.push(words.slice(start, end).join(' '));
      start += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
  }

  private async _embedChunks(
    chunks: string[],
    document: DocumentEntity,
  ): Promise<object[]> {
    const embeddings = await this._embeddingService.embedBatch(chunks);

    return embeddings.map((vector, index) => ({
      id: randomUUID(),
      vector,
      payload: {
        document_id: document.id,
        title: document.title,
        source: document.driveUrl ?? document.filePath ?? '',
        content: chunks[index],
        date: document.lastModified.toISOString(),
        chunk_index: index,
        role_required: ROLE_REQUIRED,
      },
    }));
  }
}
