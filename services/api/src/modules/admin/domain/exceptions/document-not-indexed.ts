import { AppException } from 'src/core/exceptions/app.exception';

export class DocumentNotIndexed extends AppException {
  readonly code = 'DOCUMENT_NOT_INDEXED';
  readonly statusCode = 400;

  constructor() {
    super('Document not indexed.');
  }
}
