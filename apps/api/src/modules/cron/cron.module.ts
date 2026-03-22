import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { LogTtlService } from './log-ttl.service';
import { TransactionReportService } from './transaction-report.service';

@Module({
  providers: [CronService, TransactionReportService, LogTtlService],
})
export class CronModule {}
