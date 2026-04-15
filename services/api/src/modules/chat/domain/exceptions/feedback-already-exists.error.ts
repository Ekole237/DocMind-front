import { AppException } from 'src/core/exceptions/app.exception';

export class FeedbackAlreadyExists extends AppException {
  readonly code = 'FEEDBACK_ALREADY_EXISTS';
  readonly statusCode = 409;

  constructor() {
    super('Cette réponse a déjà été signalée.');
  }
}
