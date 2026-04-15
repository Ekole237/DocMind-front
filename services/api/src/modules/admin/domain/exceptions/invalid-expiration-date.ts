import { AppException } from 'src/core/exceptions/app.exception';

export class InvalidExpirationDate extends AppException {
  readonly code = 'INVALID_EXPIRATION_DATE';
  readonly statusCode = 400;

  constructor() {
    super("La date d'expiration doit être dans le futur.");
  }
}
