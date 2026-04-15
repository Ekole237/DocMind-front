import { FeedbackEntity } from 'src/core/domain/entities/feedback.entity';
import { FeedbackStatus } from 'src/core/domain/enums/feedback-status';

export const FEEDBACK_REPOSITORY = Symbol('FeedbackRepository');

export interface FeedbackListFilter {
  status?: FeedbackStatus | 'all';
  page?: number;
}

export interface FeedbackRepository {
  listFeedbacks(
    filter: FeedbackListFilter,
  ): Promise<{ feedbacks: FeedbackEntity[]; total: number }>;
  markAsResolved(id: string): Promise<FeedbackEntity>;
  findById(id: string): Promise<FeedbackEntity | null>;
  countByStatus(status: FeedbackStatus): Promise<number>;
}
