import { AppException } from 'src/core/exceptions/app.exception';

export class InvalidCredentialsError extends AppException {
  readonly code = 'INVALID_CREDENTIALS';
  readonly statusCode = 401;

  constructor() {
    super('Identifiants incorrects. Vérifiez votre email et mot de passe.');
  }
}
