import { AppException } from 'src/core/exceptions/app.exception';

export class InvalidFormat extends AppException {
  readonly code: string = 'INVALID_FORMAT';
  readonly statusCode: number = 400;

  constructor(message: string) {
    super('Invalid format: ' + message);
  }
}
