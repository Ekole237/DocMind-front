import {
  FEEDBACK_REPOSITORY,
  FeedbackListFilter,
  type FeedbackRepository,
} from '#admin/domain/repositories/feedback.repository';
import { Inject, Injectable } from '@nestjs/common';
import { FeedbackEntity } from 'src/core/domain/entities/feedback.entity';

@Injectable()
export class ListFeedbacksUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly _feedbackRepository: FeedbackRepository,
  ) {}

  async execute(
    filter: FeedbackListFilter,
  ): Promise<{ feedbacks: FeedbackEntity[]; total: number }> {
    return await this._feedbackRepository.listFeedbacks(filter);
  }
}
