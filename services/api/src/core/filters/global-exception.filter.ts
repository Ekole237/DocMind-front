import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly _logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    if (exception instanceof AppException) {
      void res.status(exception.statusCode).send({
        code: exception.code,
        message: exception.message,
      });
      return;
    }

    if (exception instanceof HttpException) {
      void res.status(exception.getStatus()).send(exception.getResponse());
      return;
    }

    this._logger.error(exception);
    void res.status(500).send({ message: 'Erreur interne du serveur.' });
  }
}
