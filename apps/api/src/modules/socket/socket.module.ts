import { Module } from '@nestjs/common';
import { AppLoggerModule } from '../logger/logger.module';
import { UtilityModule } from '../utility/utility.module';
import { SocketGateway } from './socket.gateway';
import { SocketController } from './socket.controller';

@Module({
  imports: [UtilityModule, AppLoggerModule],
  controllers: [SocketController],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
