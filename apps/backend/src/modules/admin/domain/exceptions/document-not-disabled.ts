import { AppException } from 'src/core/exceptions/app.exception';

export class DocumentNotDisabled extends AppException {
  readonly code = 'DOCUMENT_NOT_DISABLED';
  readonly statusCode = 400;

  constructor() {
    super('Document must be DISABLED to be re-enabled.');
  }
}
