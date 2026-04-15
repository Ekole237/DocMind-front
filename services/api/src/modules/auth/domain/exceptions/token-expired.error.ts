import { AppException } from 'src/core/exceptions/app.exception';

export class TokenExpiredError extends AppException {
  readonly code = 'TOKEN_EXPIRED';
  readonly statusCode = 401;

  constructor() {
    super('Ce lien a expiré. Faites une nouvelle demande de connexion.');
  }
}
