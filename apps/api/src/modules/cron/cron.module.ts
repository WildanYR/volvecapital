import { Module } from '@nestjs/common';
import { TaskQueueModule } from '../task-queue/task-queue.module';
import { UtilityModule } from '../utility/utility.module';
import { VoucherModule } from '../voucher/voucher.module';
import { AttendanceCronService } from './attendance-cron.service';
import { CronService } from './cron.service';
import { ExpiryReminderService } from './expiry-reminder.service';
import { LogTtlService } from './log-ttl.service';
import { TransactionReportService } from './transaction-report.service';

@Module({
  imports: [VoucherModule, UtilityModule, TaskQueueModule],
  providers: [CronService, TransactionReportService, LogTtlService, ExpiryReminderService, AttendanceCronService],
})
export class CronModule {}
