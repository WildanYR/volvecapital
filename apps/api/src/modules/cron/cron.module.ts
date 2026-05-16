import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { LogTtlService } from './log-ttl.service';
import { TransactionReportService } from './transaction-report.service';
import { VoucherModule } from '../voucher/voucher.module';
import { ExpiryReminderService } from './expiry-reminder.service';
import { UtilityModule } from '../utility/utility.module';

@Module({
  imports: [VoucherModule, UtilityModule],
  providers: [CronService, TransactionReportService, LogTtlService, ExpiryReminderService],
})
export class CronModule {}
