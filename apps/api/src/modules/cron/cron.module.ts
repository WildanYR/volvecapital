import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { LogTtlService } from './log-ttl.service';
import { TransactionReportService } from './transaction-report.service';
import { VoucherModule } from '../voucher/voucher.module';
import { ExpiryReminderService } from './expiry-reminder.service';
import { UtilityModule } from '../utility/utility.module';
import { TaskQueueModule } from '../task-queue/task-queue.module';

@Module({
  imports: [VoucherModule, UtilityModule, TaskQueueModule],
  providers: [CronService, TransactionReportService, LogTtlService, ExpiryReminderService],
})
export class CronModule {}
