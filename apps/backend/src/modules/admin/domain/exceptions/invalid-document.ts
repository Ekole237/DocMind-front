import { AppException } from 'src/core/exceptions/app.exception';

export class InvalidDocument extends AppException {
  readonly code: string = 'INVALID_DOCUMENT';
  readonly statusCode: number = 400;

  constructor(message: string) {
    super('Invalid document: ' + message);
  }
}
