import { AppException } from 'src/core/exceptions/app.exception';

export class UserAlreadyExistsError extends AppException {
  readonly code = 'USER_ALREADY_EXISTS';
  readonly statusCode = 409;

  constructor() {
    super('Un compte actif existe déjà pour cet email.');
  }
}
