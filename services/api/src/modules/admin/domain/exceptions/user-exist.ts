import { AppException } from 'src/core/exceptions/app.exception';

export class UserExist extends AppException {
  readonly code = 'USER_EXIST';
  readonly statusCode = 400;

  constructor(email: string) {
    super(`User ${email} already exists`);
  }
}
