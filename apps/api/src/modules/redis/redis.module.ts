import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/constants/provider.const';
import { AppLoggerService } from '../logger/logger.service';

@Global()
@Module({
  providers: [{
    provide: REDIS_CLIENT,
    useFactory: (configService: ConfigService, logger: AppLoggerService) => {
      return new Redis({
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
        connectTimeout: 10000,
        keepAlive: 10000,
        retryStrategy: (times) => {
          if (times > 20) {
            logger.error('Redis connection unstable, retrying...', undefined, 'RedisModule');
            return 30000;
          }

          // Exponential Backoff:
          // Percobaan 1: 50ms
          // Percobaan 2: 100ms
          // ...
          // Maksimal delay: 10000ms (10 detik)
          const delay = Math.min(times * 50, 10000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });
    },
    inject: [ConfigService, AppLoggerService],
  }],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
