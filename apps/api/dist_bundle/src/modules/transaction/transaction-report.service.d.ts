import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
export declare class TransactionReportService {
    private readonly logger;
    private readonly postgresProvider;
    private readonly tenantRepository;
    sqlPeriodicQuery: {
        createParamsTable: string;
        dailyRevenue: string;
        dailyProductSales: string;
        dailyPeakHour: string;
        dailyPlatform: string;
    };
    sqlDailyMonthlyQuery: {
        createParamsTable: string;
        finalizeDailyRevenue: string;
        monthlyRevenue: string;
        finalizeDailyProductSales: string;
        monthlyProductSales: string;
        finalizeDailyPeakHour: string;
        monthlyPeakHour: string;
        finalizeDailyPlatform: string;
        monthlyPlatform: string;
    };
    constructor(logger: AppLoggerService, postgresProvider: PostgresProvider, tenantRepository: typeof Tenant);
    private getTenants;
    periodicReport(): Promise<void>;
    dailyReport(): Promise<void>;
}
