import { Module } from '@nestjs/common';
import { SocketModule } from '../socket/socket.module';
import { UtilityModule } from '../utility/utility.module';
import { EmailForwardController } from './email-forward.controller';
import { EmailForwardService } from './email-forward.service';

@Module({
  imports: [UtilityModule, SocketModule],
  providers: [EmailForwardService],
  controllers: [EmailForwardController],
})
export class EmailForwardModule {}
