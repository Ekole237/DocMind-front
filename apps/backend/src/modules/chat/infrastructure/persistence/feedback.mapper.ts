import type { Feedback as PrismaFeedback } from '#prisma/client';
import { FeedbackEntity } from 'src/core/domain/entities/feedback.entity';
import { FeedbackStatus } from 'src/core/domain/enums/feedback-status';

export class FeedbackMapper {
  static toDomain(raw: PrismaFeedback): FeedbackEntity {
    return FeedbackEntity.reconstitute(
      raw.id,
      raw.queryLogId,
      raw.comment ?? null,
      raw.status as FeedbackStatus,
      raw.createdAt,
      raw.resolvedAt ?? null,
    );
  }

  static toOrm(feedback: FeedbackEntity): Omit<PrismaFeedback, 'queryLog'> {
    return {
      id: feedback.id,
      queryLogId: feedback.queryLogId,
      comment: feedback.comment,
      status: feedback.status as PrismaFeedback['status'],
      createdAt: feedback.createdAt,
      resolvedAt: feedback.resolvedAt,
    };
  }
}
