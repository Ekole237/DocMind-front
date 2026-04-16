import { randomUUID } from 'crypto';
import { FeedbackStatus } from '../enums/feedback-status';

export class FeedbackEntity {
  private constructor(
    private readonly _id: string,
    private readonly _queryLogId: string,
    private readonly _comment: string | null,
    private readonly _status: FeedbackStatus,
    private readonly _createdAt: Date,
    private readonly _resolvedAt: Date | null,
  ) {}

  static create(
    queryLogId: string,
    comment: string | null = null,
  ): FeedbackEntity {
    return new FeedbackEntity(
      randomUUID(),
      queryLogId,
      comment,
      FeedbackStatus.PENDING,
      new Date(),
      null,
    );
  }

  static reconstitute(
    id: string,
    queryLogId: string,
    comment: string | null,
    status: FeedbackStatus,
    createdAt: Date,
    resolvedAt: Date | null,
  ): FeedbackEntity {
    return new FeedbackEntity(
      id,
      queryLogId,
      comment,
      status,
      createdAt,
      resolvedAt,
    );
  }

  get id(): string {
    return this._id;
  }
  get queryLogId(): string {
    return this._queryLogId;
  }
  get comment(): string | null {
    return this._comment;
  }
  get status(): FeedbackStatus {
    return this._status;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get resolvedAt(): Date | null {
    return this._resolvedAt;
  }
}
