import { AppException } from 'src/core/exceptions/app.exception';

export class GuestAccessExpiredError extends AppException {
  readonly code = 'GUEST_ACCESS_EXPIRED';
  readonly statusCode = 401;

  constructor() {
    super('Ce lien a expiré. Contactez votre administrateur.');
  }
}
