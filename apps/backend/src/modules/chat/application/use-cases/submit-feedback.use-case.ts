import { FeedbackAlreadyExists } from '#chat/domain/exceptions/feedback-already-exists.error';
import { QueryLogNotFound } from '#chat/domain/exceptions/query-log-not-found.error';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
} from '#chat/domain/repositories/feedback.repository';
import {
  QUERY_LOG_REPOSITORY,
  type QueryLogRepository,
} from '#chat/domain/repositories/query-log.repository';
import { Inject, Injectable } from '@nestjs/common';
import { FeedbackEntity } from 'src/core/domain/entities/feedback.entity';
import { hashUserId } from 'src/core/utils/hash.util';
import { SubmitFeedbackDto } from '../dto/submit-feedback.dto';

export interface FeedbackResponse {
  id: string;
  queryLogId: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class SubmitFeedbackUseCase {
  constructor(
    @Inject(QUERY_LOG_REPOSITORY)
    private readonly _queryLogRepository: QueryLogRepository,
    @Inject(FEEDBACK_REPOSITORY)
    private readonly _feedbackRepository: FeedbackRepository,
  ) {}

  async execute(
    dto: SubmitFeedbackDto,
    userId: string,
  ): Promise<FeedbackResponse> {
    const queryLog = await this._queryLogRepository.findById(dto.queryLogId);

    if (!queryLog || queryLog.userIdHash !== hashUserId(userId)) {
      throw new QueryLogNotFound();
    }

    const existing = await this._feedbackRepository.findByQueryLogId(
      dto.queryLogId,
    );
    if (existing) {
      throw new FeedbackAlreadyExists();
    }

    const feedback = FeedbackEntity.create(dto.queryLogId, dto.comment ?? null);
    await this._feedbackRepository.save(feedback);
    await this._queryLogRepository.flagById(dto.queryLogId);

    return {
      id: feedback.id,
      queryLogId: feedback.queryLogId,
      status: feedback.status,
      createdAt: feedback.createdAt,
    };
  }
}
