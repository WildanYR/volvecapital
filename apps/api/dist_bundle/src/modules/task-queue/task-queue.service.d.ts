import Redis from 'ioredis';
import { TaskQueue } from 'src/database/models/task-queue.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { SnowflakeIdProvider } from '../utility/snowflake-id.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { UpsertTaskQueueDto } from './dto/upsert-task-queue.dto';
import { ITaskQueueGetFilter } from './filter/task-queue-get.filter';
export declare class TaskQueueService {
    private readonly paginationProvider;
    private readonly snowflakeIdProvider;
    private readonly postgresProvider;
    private readonly redisClient;
    private readonly taskQueueRepository;
    constructor(paginationProvider: PaginationProvider, snowflakeIdProvider: SnowflakeIdProvider, postgresProvider: PostgresProvider, redisClient: Redis, taskQueueRepository: typeof TaskQueue);
    findAll(pagination?: BaseGetAllUrlQuery, filter?: ITaskQueueGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<TaskQueue>>;
    findOne(taskQueueId: string): Promise<TaskQueue>;
    upsert(upsertTaskQueueDto: UpsertTaskQueueDto[]): Promise<void>;
    remove(taskQueueId: string): Promise<void>;
    removeByAccount(tenantId: string, accountId: string, contexts: string[]): Promise<void>;
}
