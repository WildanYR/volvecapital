import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './configs/app.config';
import { DatabaseConfig } from './configs/database.config';
import { DatabaseModule } from './database/database.module';
import { EmailForwardModule } from './modules/email-forward/email-forward.module';
import { AppLoggerModule } from './modules/logger/logger.module';
import { SocketModule } from './modules/socket/socket.module';
import { UtilityModule } from './modules/utility/utility.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [AppConfig, DatabaseConfig],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 10000,
    }),
    DatabaseModule,
    UtilityModule,
    AppLoggerModule,
    SocketModule,
    EmailForwardModule,
  ],
})
export class AppModule {}
