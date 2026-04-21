import {
  CHAT_SESSION_REPOSITORY,
  type ChatSessionRepository,
} from '#chat/domain/repositories/chat-session.repository';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hashUserId } from 'src/core/utils/hash.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryLogMapper } from '#chat/infrastructure/persistence/query-log.mapper';
import { SourceRef } from './query-rag.use-case';

export interface ChatSessionLogDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isIgnorance: boolean;
  responseTimeMs?: number;
  source: SourceRef | null;
  queryLogId?: string;
  hasFeedback?: boolean;
}

@Injectable()
export class GetSessionLogsUseCase {
  constructor(
    @Inject(CHAT_SESSION_REPOSITORY)
    private readonly _chatSessionRepository: ChatSessionRepository,
    private readonly _prisma: PrismaService,
  ) {}

  async execute(
    sessionId: string,
    userId: string,
  ): Promise<ChatSessionLogDto[]> {
    const userIdHash = hashUserId(userId);
    const session = await this._chatSessionRepository.findById(sessionId);

    if (!session || session.userIdHash !== userIdHash) {
      throw new NotFoundException('Session not found');
    }

    const rawLogs = await this._prisma.queryLog.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { timestamp: 'asc' },
      include: { feedback: true },
    });

    const messages: ChatSessionLogDto[] = [];

    for (const raw of rawLogs) {
      const domainLog = QueryLogMapper.toDomain(raw);

      messages.push({
        id: domainLog.id + '-user',
        role: 'user',
        content: domainLog.question,
        isIgnorance: false,
        source: null,
      });

      messages.push({
        id: domainLog.id,
        role: 'assistant',
        content: domainLog.answer,
        isIgnorance: domainLog.isIgnorance,
        responseTimeMs: domainLog.responseTimeMs ?? undefined,
        source: domainLog.sourceDocName
          ? {
              documentName: domainLog.sourceDocName,
              lastModified: domainLog.timestamp.toISOString(),
              driveUrl: domainLog.sourceDriveUrl ?? '',
              confidenceScore: 0,
            }
          : null,
        queryLogId: domainLog.id,
        hasFeedback: raw.feedback !== null,
      });
    }

    return messages;
  }
}
