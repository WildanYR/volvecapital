import { Syslog } from 'src/database/models/syslog.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateLogDto } from './dto/create-log.dto';
import { ILogGetFilter } from './filter/log-get.filter';
export declare class SyslogService {
    private readonly paginationProvider;
    private readonly postgresProvider;
    private readonly syslogRepository;
    constructor(paginationProvider: PaginationProvider, postgresProvider: PostgresProvider, syslogRepository: typeof Syslog);
    getLogWithPagination(tenantId: string, pagination?: BaseGetAllUrlQuery, filter?: ILogGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<Syslog>>;
    getSyslogWithPagination(pagination?: BaseGetAllUrlQuery, filter?: ILogGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<Syslog>>;
    logToDb(tenantId: string, createLogDto: CreateLogDto): Promise<void>;
}
