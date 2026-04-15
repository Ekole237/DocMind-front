import { AppException } from 'src/core/exceptions/app.exception';

export class QueryLogNotFound extends AppException {
  readonly code = 'QUERY_LOG_NOT_FOUND';
  readonly statusCode = 404;

  constructor() {
    super('Query log not found.');
  }
}
