import { ChatSessionEntity } from 'src/core/domain/entities/chat-session.entity';

export const CHAT_SESSION_REPOSITORY = Symbol('CHAT_SESSION_REPOSITORY');

export interface ChatSessionRepository {
  save(session: ChatSessionEntity): Promise<void>;
  findById(id: string): Promise<ChatSessionEntity | null>;
  findByUserIdHash(userIdHash: string): Promise<ChatSessionEntity[]>;
}
