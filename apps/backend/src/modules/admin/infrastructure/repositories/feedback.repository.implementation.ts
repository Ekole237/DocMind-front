import {
  FeedbackListFilter,
  type FeedbackRepository,
} from '#admin/domain/repositories/feedback.repository';
import { FeedbackMapper } from '#admin/infrastructure/persistence/feedback.mapper';
import { Injectable } from '@nestjs/common';
import { FeedbackEntity } from 'src/core/domain/entities/feedback.entity';
import { FeedbackStatus } from 'src/core/domain/enums/feedback-status';
import { PrismaService } from 'src/prisma/prisma.service';

const PAGE_SIZE = 10;

@Injectable()
export class FeedbackRepositoryImplementation implements FeedbackRepository {
  constructor(private readonly _prismaService: PrismaService) {}

  async listFeedbacks(
    filter: FeedbackListFilter,
  ): Promise<{ feedbacks: FeedbackEntity[]; total: number }> {
    const page = filter.page ?? 1;
    const skip = (page - 1) * PAGE_SIZE;

    const where =
      filter.status && filter.status !== 'all' ? { status: filter.status } : {};

    const [raws, total] = await Promise.all([
      this._prismaService.feedback.findMany({
        where,
        include: { queryLog: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      this._prismaService.feedback.count({ where }),
    ]);

    return {
      feedbacks: raws.map(({ queryLog: _queryLog, ...raw }) =>
        FeedbackMapper.toDomain(raw),
      ),
      total,
    };
  }

  async findById(id: string): Promise<FeedbackEntity | null> {
    const raw = await this._prismaService.feedback.findUnique({
      where: { id },
    });

    if (!raw) {
      return null;
    }

    return FeedbackMapper.toDomain(raw);
  }

  async markAsResolved(id: string): Promise<FeedbackEntity> {
    const raw = await this._prismaService.feedback.update({
      where: { id },
      data: {
        status: FeedbackStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });

    return FeedbackMapper.toDomain(raw);
  }

  async countByStatus(status: FeedbackStatus): Promise<number> {
    return this._prismaService.feedback.count({ where: { status } });
  }
}
