import { type FeedbackRepository } from '#chat/domain/repositories/feedback.repository';
import { FeedbackMapper } from '#chat/infrastructure/persistence/feedback.mapper';
import { Injectable } from '@nestjs/common';
import { FeedbackEntity } from 'src/core/domain/entities/feedback.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FeedbackRepositoryImplementation implements FeedbackRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  async save(feedback: FeedbackEntity): Promise<void> {
    await this._prismaService.feedback.create({
      data: FeedbackMapper.toOrm(feedback),
    });
  }

  async findByQueryLogId(queryLogId: string): Promise<FeedbackEntity | null> {
    const raw = await this._prismaService.feedback.findUnique({
      where: { queryLogId },
    });
    return raw ? FeedbackMapper.toDomain(raw) : null;
  }
}
