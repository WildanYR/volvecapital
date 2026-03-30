import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './configs/app.config';
import { DatabaseConfig } from './configs/database.config';
import { TokenConfig } from './configs/token.config';
import { DatabaseModule } from './database/database.module';
import { AppLoggerModule } from './modules/logger/logger.module';
import { SocketModule } from './modules/socket/socket.module';
import { UtilityModule } from './modules/utility/utility.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [AppConfig, TokenConfig, DatabaseConfig],
    }),
    DatabaseModule,
    UtilityModule,
    AppLoggerModule,
    SocketModule,
  ],
})
export class AppModule {}
