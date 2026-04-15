import { AppException } from 'src/core/exceptions/app.exception';

export class DocumentNotFound extends AppException {
  readonly code = 'DOCUMENT_NOT_FOUND';
  readonly statusCode = 400;

  constructor() {
    super('Document not found.');
  }
}
