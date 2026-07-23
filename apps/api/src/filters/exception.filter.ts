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

      // Auto-restart safeguard: if Sequelize connection timeout occurs, forcefully exit so PM2 can restart
      if (
        exception?.name === 'SequelizeConnectionAcquireTimeoutError' ||
        errorMessage.includes('SequelizeConnectionAcquireTimeoutError')
      ) {
        this.logger.error(
          'CRITICAL: Database connection timeout detected! Exiting process to trigger PM2 auto-restart...',
          '',
          'AppException',
        );
        setTimeout(() => process.exit(1), 1000);
      }
    }
    const response: Response = ctx.getResponse();
    httpAdapter.reply(
      response,
      { message: errorMessage, ...additionalInfo },
      statusCode,
    );
  }
}
