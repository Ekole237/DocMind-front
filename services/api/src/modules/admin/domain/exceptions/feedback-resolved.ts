import { AppException } from 'src/core/exceptions/app.exception';

export class FeedbackResolved extends AppException {
  readonly code: string = 'FEEDBACK_RESOLVED';
  readonly statusCode: number = 428;

  constructor() {
    super('Feedback already resolved');
  }
}
