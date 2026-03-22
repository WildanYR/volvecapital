import { LogTtlService } from './log-ttl.service';
import { TransactionReportService } from './transaction-report.service';
export declare class CronService {
    private readonly transactionReportService;
    private readonly logTtlService;
    constructor(transactionReportService: TransactionReportService, logTtlService: LogTtlService);
    everyThreeHour(): Promise<void>;
    everyMidnight(): Promise<void>;
}
