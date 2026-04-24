import { Module } from '@nestjs/common';
import { SocketModule } from '../socket/socket.module';
import { UtilityModule } from '../utility/utility.module';
import { TaskHelperService } from './task-helper.service';
import { TaskQueueService } from './task-queue.service';
import { TaskWorkerService } from './task-worker.service';

@Module({
  imports: [
    UtilityModule,
    SocketModule,
  ],
  providers: [TaskQueueService, TaskWorkerService, TaskHelperService],
  exports: [TaskQueueService],
})
export class TaskQueueModule {}
