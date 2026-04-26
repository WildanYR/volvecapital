import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { LogTtlService } from './log-ttl.service';
import { TransactionReportService } from './transaction-report.service';
import { VoucherModule } from '../voucher/voucher.module';

@Module({
  imports: [VoucherModule],
  providers: [CronService, TransactionReportService, LogTtlService],
})
export class CronModule {}
