import { Module } from '@nestjs/common';
import { SocketModule } from '../socket/socket.module';
import { SocketTestController } from './socket-test.controller';

@Module({
  imports: [SocketModule],
  controllers: [SocketTestController],
})
export class SocketTestModule {}
