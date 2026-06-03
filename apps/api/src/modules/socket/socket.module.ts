import { Module } from '@nestjs/common';
import { AppLoggerModule } from '../logger/logger.module';
import { SocketController } from './socket.controller';
import { SocketService } from './socket.service';

@Module({
  imports: [AppLoggerModule],
  providers: [SocketService],
  controllers: [SocketController],
  exports: [SocketService],
})
export class SocketModule {}
