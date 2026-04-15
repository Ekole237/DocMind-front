import { AppException } from 'src/core/exceptions/app.exception';

export class DocumentAlreadyExists extends AppException {
  readonly code = 'DOCUMENT_ALREADY_EXISTS';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
