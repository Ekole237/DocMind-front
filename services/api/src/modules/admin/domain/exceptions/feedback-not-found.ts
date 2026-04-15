import { AppException } from 'src/core/exceptions/app.exception';

export class FeedbackNotFound extends AppException {
  readonly code: string = 'FEEDBACK_NOT_FOUND';
  readonly statusCode: number = 404;

  constructor() {
    super('Feedback not found');
  }
}
