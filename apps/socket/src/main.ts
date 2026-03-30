import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLoggerService } from './modules/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const appLogger = app.get(AppLoggerService);

  app.useLogger(appLogger);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(configService.get<number>('app.port')!);
}

bootstrap();
