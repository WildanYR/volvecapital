import { Syslog } from 'src/database/models/syslog.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
export declare class LogTtlService {
    private readonly logger;
    private readonly postgresProvider;
    private readonly syslogRepository;
    constructor(logger: AppLoggerService, postgresProvider: PostgresProvider, syslogRepository: typeof Syslog);
    deleteOldLog(): Promise<void>;
}
