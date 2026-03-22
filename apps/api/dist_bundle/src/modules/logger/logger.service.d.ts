import { LoggerService as NestLoggerService } from '@nestjs/common';
import { Syslog } from 'src/database/models/syslog.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { DateConverterProvider } from '../utility/date-converter.provider';
export declare class AppLoggerService implements NestLoggerService {
    private readonly dateConverterProvider;
    private readonly postgresProvider;
    private readonly syslogRepository;
    private readonly logger;
    constructor(dateConverterProvider: DateConverterProvider, postgresProvider: PostgresProvider, syslogRepository: typeof Syslog);
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
    verbose(message: string, context?: string): void;
    private saveLogToDb;
}
