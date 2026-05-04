import { Module } from '@nestjs/common';
import { TaskQueueModule } from '../task-queue/task-queue.module';
import { UtilityModule } from '../utility/utility.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [UtilityModule, TaskQueueModule],
  providers: [AccountService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
