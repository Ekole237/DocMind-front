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
  type DocumentChunk,
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

const CONVERSATIONAL_PATTERNS = [
  /^(bonjour|bonsoir|salut|coucou|hello|hi|hey)\b/i,
  /^(merci|thank you|thanks)\b/i,
  /^(au revoir|bye|à bientôt|bonne journée|bonne soirée)\b/i,
  /^comment (ça va|vas-tu|allez-vous|tu vas)\b/i,
  /^(ça va|comment ça)\b/i,
];

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

    if (isConversational(dto.question)) {
      const answer = await this._llmService.completeConversational(
        dto.question,
      );
      const responseTimeMs = Date.now() - start;
      const queryLog = QueryLogEntity.create(
        userIdHash,
        dto.question,
        answer,
        role,
        isGuest,
        false,
        null,
        null,
        null,
        responseTimeMs,
      );
      await this._queryLogRepository.save(queryLog);
      return {
        answer,
        isIgnorance: false,
        source: null,
        queryLogId: queryLog.id,
        responseTimeMs,
      };
    }

    const chunks = await this._vectorSearchService.searchChunks(
      dto.question,
      roleLevel,
      TOP_K,
      threshold,
    );

    const isIgnorance = chunks.length === 0;
    let sourceChunk: DocumentChunk | null = chunks[0] ?? null;

    let answerText = IGNORANCE_RESPONSE;
    let exactQuote: string | null = null;

    if (!isIgnorance) {
      const response = await this._llmService.complete(chunks, dto.question);
      answerText = response.answer;
      sourceChunk = resolveSourceChunk(
        chunks,
        response.sourceChunkId,
        response.exactQuote,
      );
      exactQuote = getVerifiedExactQuote(sourceChunk, response.exactQuote);
    }

    const responseTimeMs = Date.now() - start;

    const queryLog = QueryLogEntity.create(
      userIdHash,
      dto.question,
      answerText,
      role,
      isGuest,
      isIgnorance,
      sourceChunk?.documentId ?? null,
      sourceChunk?.title ?? null,
      sourceChunk?.driveUrl ?? null,
      responseTimeMs,
    );

    await this._queryLogRepository.save(queryLog);

    return {
      answer: answerText,
      isIgnorance,
      source: sourceChunk
        ? {
            documentName: sourceChunk.title,
            lastModified: sourceChunk.lastModified.toISOString(),
            driveUrl: sourceChunk.driveUrl ?? '',
            confidenceScore: sourceChunk.confidenceScore,
            content: sourceChunk.content,
            exactQuote,
          }
        : null,
      queryLogId: queryLog.id,
      responseTimeMs,
    };
  }
}

function isConversational(question: string): boolean {
  const trimmed = question.trim();
  return CONVERSATIONAL_PATTERNS.some((re) => re.test(trimmed));
}

export interface SourceRef {
  documentName: string;
  lastModified: string;
  driveUrl: string;
  confidenceScore: number;
  content?: string;
  exactQuote?: string | null;
}

export interface ChatResponse {
  answer: string;
  isIgnorance: boolean;
  source: SourceRef | null;
  queryLogId: string;
  responseTimeMs: number;
}

function resolveSourceChunk(
  chunks: DocumentChunk[],
  sourceChunkId: string | null,
  exactQuote: string | null,
): DocumentChunk | null {
  if (sourceChunkId) {
    const sourceChunk = chunks.find((chunk) => chunk.id === sourceChunkId);
    if (sourceChunk) {
      return sourceChunk;
    }
  }

  if (exactQuote) {
    const sourceChunk = chunks.find((chunk) =>
      chunk.content.includes(exactQuote),
    );
    if (sourceChunk) {
      return sourceChunk;
    }
  }

  return chunks[0] ?? null;
}

function getVerifiedExactQuote(
  sourceChunk: DocumentChunk | null,
  exactQuote: string | null,
): string | null {
  if (!sourceChunk || !exactQuote) {
    return null;
  }

  return sourceChunk.content.includes(exactQuote) ? exactQuote : null;
}
