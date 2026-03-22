import { Module } from '@nestjs/common';
import { AppLoggerModule } from '../logger/logger.module';
import { UtilityModule } from '../utility/utility.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [UtilityModule, AppLoggerModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
