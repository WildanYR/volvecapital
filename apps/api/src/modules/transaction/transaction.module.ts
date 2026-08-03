import { Module } from '@nestjs/common';
import { AccountUserModule } from '../account-user/account-user.module';
import { UtilityModule } from '../utility/utility.module';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TaskQueueModule } from '../task-queue/task-queue.module';

@Module({
  imports: [UtilityModule, AccountUserModule, TaskQueueModule],
  providers: [TransactionService],
  controllers: [TransactionController],
})
export class TransactionModule {}
