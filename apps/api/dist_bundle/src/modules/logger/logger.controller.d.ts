import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateLogDto } from './dto/create-log.dto';
import { GetLogQueryDto } from './dto/get-log-query.dto';
import { SyslogService } from './syslog.service';
export declare class LoggerController {
    private readonly syslogService;
    private readonly paginationProvider;
    constructor(syslogService: SyslogService, paginationProvider: PaginationProvider);
    getLogWithPagination(query: GetLogQueryDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/syslog.model").Syslog>>;
    getSyslogWithPagination(query: GetLogQueryDto): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/syslog.model").Syslog>>;
    logToDb(createLogDto: CreateLogDto, request: AppRequest): Promise<void>;
}
