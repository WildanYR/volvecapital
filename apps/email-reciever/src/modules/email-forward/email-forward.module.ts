import { Module } from '@nestjs/common';
import { AppLoggerModule } from '../logger/logger.module';
import { SocketModule } from '../socket/socket.module';
import { UtilityModule } from '../utility/utility.module';
import { EmailForwardProcessorService } from './email-forward-processor.service';
import { EmailForwardQueueStore } from './email-forward-queue.store';
import { EmailForwardWorkerService } from './email-forward-worker.service';
import { EmailForwardController } from './email-forward.controller';
import { EmailForwardService } from './email-forward.service';

@Module({
  imports: [UtilityModule, SocketModule, AppLoggerModule],
  providers: [
    EmailForwardService,
    EmailForwardProcessorService,
    EmailForwardQueueStore,
    EmailForwardWorkerService,
  ],
  controllers: [EmailForwardController],
})
export class EmailForwardModule {}
