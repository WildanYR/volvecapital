import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Account } from 'src/database/models/account.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { BotConnectionGateway } from '../bot/bot-connection.gateway';
import { TeleNotifierService } from '../tele-notifier/tele-notifier.service';
import { ITaskQueueJobData } from './types/task-queue-job-data.type';
export declare class TaskProcessorService extends WorkerHost {
    private teleNotifierService;
    private botConnectionGateway;
    private readonly postgresProvider;
    private readonly accountRepository;
    constructor(teleNotifierService: TeleNotifierService, botConnectionGateway: BotConnectionGateway, postgresProvider: PostgresProvider, accountRepository: typeof Account);
    process(job: Job<ITaskQueueJobData>): Promise<void>;
    private handleSubsEndNotify;
    private handleNetflixResetPassword;
    private handleUnfreezeAccount;
}
