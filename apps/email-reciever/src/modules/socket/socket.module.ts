import { Module } from '@nestjs/common';
import { AppLoggerModule } from '../logger/logger.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [AppLoggerModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
