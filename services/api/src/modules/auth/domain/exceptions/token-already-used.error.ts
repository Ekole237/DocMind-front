import { AppException } from 'src/core/exceptions/app.exception';

export class TokenAlreadyUsedError extends AppException {
  readonly code = 'TOKEN_ALREADY_USED';
  readonly statusCode = 401;

  constructor() {
    super('Ce lien a déjà été utilisé.');
  }
}
