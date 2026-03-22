import { Module } from '@nestjs/common';
import { TaskQueueModule } from '../task-queue/task-queue.module';
import { TeleNotifierModule } from '../tele-notifier/tele-notifier.module';
import { UtilityModule } from '../utility/utility.module';
import { AccountUserController } from './account-user.controller';
import { AccountUserService } from './account-user.service';

@Module({
  imports: [UtilityModule, TaskQueueModule, TeleNotifierModule],
  providers: [AccountUserService],
  controllers: [AccountUserController],
  exports: [AccountUserService],
})
export class AccountUserModule {}
