import {
  CHAT_SESSION_REPOSITORY,
  type ChatSessionRepository,
} from '#chat/domain/repositories/chat-session.repository';
import { Inject, Injectable } from '@nestjs/common';
import { hashUserId } from 'src/core/utils/hash.util';

export interface ChatSessionDto {
  id: string;
  title: string;
  updatedAt: Date;
}

@Injectable()
export class ListSessionsUseCase {
  constructor(
    @Inject(CHAT_SESSION_REPOSITORY)
    private readonly _chatSessionRepository: ChatSessionRepository,
  ) {}

  async execute(userId: string): Promise<ChatSessionDto[]> {
    const userIdHash = hashUserId(userId);
    const sessions =
      await this._chatSessionRepository.findByUserIdHash(userIdHash);

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      updatedAt: s.updatedAt,
    }));
  }
}
