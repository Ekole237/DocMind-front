import { FeedbackNotFound } from '#admin/domain/exceptions/feedback-not-found';
import { FeedbackResolved } from '#admin/domain/exceptions/feedback-resolved';
import {
  FEEDBACK_REPOSITORY,
  FeedbackRepository,
} from '#admin/domain/repositories/feedback.repository';
import { Inject, Injectable } from '@nestjs/common';
import { FeedbackStatus } from 'src/core/domain/enums/feedback-status';

@Injectable()
export class ResolveFeedbackUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly _feedbackRepository: FeedbackRepository,
  ) {}

  async execute(id: string) {
    const record = await this._feedbackRepository.findById(id);

    if (!record) {
      throw new FeedbackNotFound();
    }

    if (record.status === FeedbackStatus.RESOLVED) {
      throw new FeedbackResolved();
    }

    return await this._feedbackRepository.markAsResolved(id);
  }
}
