import { ChatSessionRepository } from '#chat/domain/repositories/chat-session.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ChatSessionEntity } from 'src/core/domain/entities/chat-session.entity';

@Injectable()
export class ChatSessionRepositoryImplementation implements ChatSessionRepository {
  constructor(private readonly _prisma: PrismaService) {}

  async save(session: ChatSessionEntity): Promise<void> {
    await this._prisma.chatSession.upsert({
      where: { id: session.id },
      update: {
        title: session.title,
        updatedAt: session.updatedAt,
      },
      create: {
        id: session.id,
        userIdHash: session.userIdHash,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<ChatSessionEntity | null> {
    const raw = await this._prisma.chatSession.findUnique({
      where: { id },
    });
    if (!raw) return null;

    return ChatSessionEntity.reconstitute(
      raw.id,
      raw.userIdHash,
      raw.title,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  async findByUserIdHash(userIdHash: string): Promise<ChatSessionEntity[]> {
    const rows = await this._prisma.chatSession.findMany({
      where: { userIdHash },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((r) =>
      ChatSessionEntity.reconstitute(
        r.id,
        r.userIdHash,
        r.title,
        r.createdAt,
        r.updatedAt,
      ),
    );
  }
}
