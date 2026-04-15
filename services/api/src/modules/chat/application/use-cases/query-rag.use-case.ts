import {
  QUERY_LOG_REPOSITORY,
  type QueryLogRepository,
} from '#chat/domain/repositories/query-log.repository';
import {
  LLM_SERVICE,
  type LlmService,
} from '#chat/domain/services/llm.service';
import {
  VECTOR_SEARCH_SERVICE,
  type VectorSearchService,
} from '#chat/domain/services/vector-search.service';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { QueryLogEntity } from 'src/core/domain/entities/query-log.entity';
import { hashUserId } from 'src/core/utils/hash.util';
import { QueryDto } from '../dto/query.dto';

const IGNORANCE_RESPONSE =
  "Je n'ai pas trouvé d'information sur ce sujet dans la base documentaire RH.";
const TOP_K = 5;

export interface SourceRef {
  documentName: string;
  lastModified: string;
  driveUrl: string;
  confidenceScore: number;
}

export interface ChatResponse {
  answer: string;
  isIgnorance: boolean;
  source: SourceRef | null;
  queryLogId: string;
  responseTimeMs: number;
}

@Injectable()
export class QueryRagUseCase {
  constructor(
    @Inject(VECTOR_SEARCH_SERVICE)
    private readonly _vectorSearchService: VectorSearchService,
    @Inject(LLM_SERVICE)
    private readonly _llmService: LlmService,
    @Inject(QUERY_LOG_REPOSITORY)
    private readonly _queryLogRepository: QueryLogRepository,
    private readonly _configService: ConfigService,
  ) {}

  async execute(
    dto: QueryDto,
    userId: string,
    role: string,
    roleLevel: number,
    isGuest: boolean,
  ): Promise<ChatResponse> {
    const start = Date.now();
    const userIdHash = hashUserId(userId);
    const threshold = parseFloat(
      this._configService.get<string>('SIMILARITY_THRESHOLD', '0.5'),
    );

    const chunks = await this._vectorSearchService.searchChunks(
      dto.question,
      roleLevel,
      TOP_K,
      threshold,
    );

    const isIgnorance = chunks.length === 0;
    const primaryChunk = chunks[0] ?? null;

    const answer = isIgnorance
      ? IGNORANCE_RESPONSE
      : await this._llmService.complete(chunks, dto.question);

    const responseTimeMs = Date.now() - start;

    const queryLog = QueryLogEntity.create(
      userIdHash,
      dto.question,
      answer,
      role,
      isGuest,
      isIgnorance,
      primaryChunk?.documentId ?? null,
      primaryChunk?.title ?? null,
      primaryChunk?.driveUrl ?? null,
      responseTimeMs,
    );

    await this._queryLogRepository.save(queryLog);

    return {
      answer,
      isIgnorance,
      source: primaryChunk
        ? {
            documentName: primaryChunk.title,
            lastModified: primaryChunk.lastModified.toISOString(),
            driveUrl: primaryChunk.driveUrl ?? '',
            confidenceScore: primaryChunk.confidenceScore,
          }
        : null,
      queryLogId: queryLog.id,
      responseTimeMs,
    };
  }
}
