import { Module } from '@nestjs/common';
import { AppLoggerModule } from '../logger/logger.module';
import { UtilityModule } from '../utility/utility.module';
import { InternalAuthGuard } from './internal-auth.guard';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Module({
  imports: [UtilityModule, AppLoggerModule],
  providers: [SocketGateway, SocketService, InternalAuthGuard],
  controllers: [SocketController],
})
export class SocketModule {}
