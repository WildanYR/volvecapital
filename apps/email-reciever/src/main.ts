import type { ValidationError } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InvalidDataException } from './exceptions/invalid-data.exception';
import { ApiExceptionFilter } from './filters/exception.filter';
import { AppLoggerService } from './modules/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);
  const appLogger = app.get(AppLoggerService);

  console.error = (...args) => {
    let message = '';
    let stack = '';

    for (const arg of args) {
      if (arg instanceof Error) {
        message += `${arg.message} `;
        stack += arg.stack;
      }
      else {
        message += `${arg} `;
      }
    }

    appLogger.error(message, stack);
  };

  app.useLogger(appLogger);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new InvalidDataException(errors),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter(httpAdapterHost, appLogger));

  await app.listen(configService.get<number>('app.port')!);
}

bootstrap();
