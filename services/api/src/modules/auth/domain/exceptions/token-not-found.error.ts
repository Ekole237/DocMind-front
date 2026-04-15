import { AppException } from 'src/core/exceptions/app.exception';

export class TokenNotFoundError extends AppException {
  readonly code = 'TOKEN_NOT_FOUND';
  readonly statusCode = 404;

  constructor() {
    super('Token introuvable.');
  }
}
