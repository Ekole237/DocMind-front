import { FeedbackEntity } from 'src/core/domain/entities/feedback.entity';

export const FEEDBACK_REPOSITORY = Symbol('FeedbackRepository');

export interface FeedbackRepository {
  save(feedback: FeedbackEntity): Promise<void>;
  findByQueryLogId(queryLogId: string): Promise<FeedbackEntity | null>;
}
