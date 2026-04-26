import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LogTtlService } from './log-ttl.service';
import { TransactionReportService } from './transaction-report.service';
import { VoucherService } from '../voucher/voucher.service';

@Injectable()
export class CronService {
  constructor(
    private readonly transactionReportService: TransactionReportService,
    private readonly logTtlService: LogTtlService,
    private readonly voucherService: VoucherService,
  ) {}

  @Cron('0 */3 * * *', { timeZone: 'Asia/Jakarta' })
  async everyThreeHour() {
    await this.transactionReportService.periodicReport();
  }

  @Cron('0 1 * * *', { timeZone: 'Asia/Jakarta' })
  async everyMidnight() {
    await this.logTtlService.deleteOldLog();
    await this.transactionReportService.dailyReport();
  }

  @Cron('*/15 * * * *', { timeZone: 'Asia/Jakarta' })
  async everyFifteenMinutes() {
    await this.voucherService.autoExpireVouchers();
  }
}
