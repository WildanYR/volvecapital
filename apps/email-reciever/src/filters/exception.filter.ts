import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AppLoggerService } from 'src/modules/logger/logger.service';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: AppLoggerService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let statusCode: HttpStatus;
    let errorMessage: string;
    let additionalInfo: any;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const { message, ...info } = exceptionResponse as any;
      errorMessage = message;
      additionalInfo = info;
    }
    else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorMessage = 'Internal Server Error';
      this.logger.error(
        (exception as Error).message,
        (exception as Error).stack,
        'AppException',
      );
    }

    const response: Response = ctx.getResponse();
    httpAdapter.reply(
      response,
      { message: errorMessage, ...additionalInfo },
      statusCode,
    );
  }
}
