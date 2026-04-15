import { AppException } from 'src/core/exceptions/app.exception';

export class MaxFileSize extends AppException {
  readonly code = 'MAX_FILE_SIZE';
  readonly statusCode = 400;

  constructor(maxSize: number) {
    super(`Max file size is ${maxSize} bytes`);
  }
}
