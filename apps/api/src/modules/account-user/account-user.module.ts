import { Module } from '@nestjs/common';
import { TaskQueueModule } from '../task-queue/task-queue.module';
import { UtilityModule } from '../utility/utility.module';
import { AccountUserController } from './account-user.controller';
import { AccountUserService } from './account-user.service';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [UtilityModule, TaskQueueModule, AccountModule],
  providers: [AccountUserService],
  controllers: [AccountUserController],
  exports: [AccountUserService],
})
export class AccountUserModule {}
