import { AppException } from 'src/core/exceptions/app.exception';

export class InvalidGuestToken extends AppException {
  readonly code = 'INVALID_GUEST_TOKEN';
  readonly statusCode = 400;

  constructor() {
    super('Invalid guest token');
  }
}
