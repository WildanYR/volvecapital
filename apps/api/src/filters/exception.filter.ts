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
      errorMessage = (exception as Error).message || 'Internal Server Error';
      
      // Detailed logging for Sequelize Validation Errors
      const details = (exception as any).errors 
        ? JSON.stringify((exception as any).errors.map((e: any) => ({ field: e.path, message: e.message })))
        : '';

      this.logger.error(
        `${errorMessage} ${details}`,
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
