import { AppException } from 'src/core/exceptions/app.exception';

export class ConfidentialityError extends AppException {
  readonly code: string = 'CONFIDENTIALITY_ERROR';
  readonly statusCode: number = 400;

  constructor(message: string) {
    super('Confidentiality error: ' + message);
  }
}
