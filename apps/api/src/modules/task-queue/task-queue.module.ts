import { Module } from '@nestjs/common';
import { SocketModule } from '../socket/socket.module';
import { TeleNotifierModule } from '../tele-notifier/tele-notifier.module';
import { UtilityModule } from '../utility/utility.module';
import { TaskHelperService } from './task-helper.service';
import { TaskQueueService } from './task-queue.service';
import { TaskWorkerService } from './task-worker.service';

@Module({
  imports: [
    UtilityModule,
    TeleNotifierModule,
    SocketModule,
  ],
  providers: [TaskQueueService, TaskWorkerService, TaskHelperService],
  exports: [TaskQueueService],
})
export class TaskQueueModule {}
