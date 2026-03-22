import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TaskQueue } from 'src/database/models/task-queue.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { TaskHelperService } from './task-helper.service';
export declare class TaskWorkerService {
    private readonly logger;
    private readonly configService;
    private readonly taskHelperService;
    private readonly postgresProvider;
    private readonly redisClient;
    private readonly taskQueueRepository;
    instanceName: string;
    constructor(logger: AppLoggerService, configService: ConfigService, taskHelperService: TaskHelperService, postgresProvider: PostgresProvider, redisClient: Redis, taskQueueRepository: typeof TaskQueue);
    onModuleInit(): Promise<void>;
    consumeTasks(): Promise<void>;
    dispatchReadyTasks(): Promise<void>;
    recoverPendingTasks(): Promise<void>;
    private handleMessage;
}
