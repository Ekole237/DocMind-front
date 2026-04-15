import { AppException } from 'src/core/exceptions/app.exception';

export class IndexingError extends AppException {
  readonly code: string = 'INDEXING_ERROR';
  readonly statusCode: number = 400;

  constructor(message: string) {
    super('Indexing error: ' + message);
  }
}
