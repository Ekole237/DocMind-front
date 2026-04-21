import {
  QUERY_LOG_REPOSITORY,
  type QueryLogRepository,
} from '#chat/domain/repositories/query-log.repository';
import {
  CHAT_SESSION_REPOSITORY,
  type ChatSessionRepository,
} from '#chat/domain/repositories/chat-session.repository';
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
import { ChatSessionEntity } from 'src/core/domain/entities/chat-session.entity';
import { QueryLogEntity } from 'src/core/domain/entities/query-log.entity';
import { hashUserId } from 'src/core/utils/hash.util';
import { QueryDto } from '../dto/query.dto';
import { NotFoundException } from '@nestjs/common';

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

function isConversational(question: string): boolean {
  const trimmed = question.trim();
  return CONVERSATIONAL_PATTERNS.some((re) => re.test(trimmed));
}

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
  context_id: string;
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
    @Inject(CHAT_SESSION_REPOSITORY)
    private readonly _chatSessionRepository: ChatSessionRepository,
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

    let chatSessionId = dto.context_id;

    if (chatSessionId) {
      const session = await this._chatSessionRepository.findById(chatSessionId);
      if (!session || session.userIdHash !== userIdHash) {
        throw new NotFoundException('Session not found');
      }
    } else {
      const title =
        dto.question.substring(0, 40) + (dto.question.length > 40 ? '...' : '');
      const newSession = ChatSessionEntity.create(userIdHash, title);
      await this._chatSessionRepository.save(newSession);
      chatSessionId = newSession.id;
    }

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
        chatSessionId,
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
        context_id: chatSessionId,
      };
    }

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
      chatSessionId,
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
      context_id: chatSessionId,
    };
  }
}
