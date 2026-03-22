import { Request } from 'express';
import { Observable, Subject } from 'rxjs';
import { TaskQueue } from 'src/database/models/task-queue.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { BotConnectQueryDto } from './dto/bot-connect-query.dto';
import { SseEvent } from './types/bot.type';
import { SendTaskStatus } from './types/send-task.type';
export declare class BotService {
    private readonly logger;
    private readonly postgresProvider;
    private readonly taskQueueRepository;
    private bots;
    private tasks;
    private heartbeat$;
    constructor(logger: AppLoggerService, postgresProvider: PostgresProvider, taskQueueRepository: typeof TaskQueue);
    addBot(botConnectQueryDto: BotConnectQueryDto, req: Request): {
        subject: Subject<SseEvent<any>>;
        close$: Observable<unknown>;
        botId: string;
    };
    streamFor(subject$: Subject<SseEvent>, close$: Observable<unknown>): Observable<SseEvent>;
    private onBotDisconnected;
    sendTask(taskQueueId: string): Promise<SendTaskStatus>;
    private selectBot;
    private dispatchToBot;
    ackTask(taskId: string, botId: string): Promise<void>;
    completeTask(taskId: string, botId: string): Promise<{
        ok: boolean;
    } | undefined>;
    failTask(taskId: string, botId: string, error?: string): Promise<{
        ok: boolean;
    } | undefined>;
    private onAckTimeout;
    private onDoneTimeout;
    private finishTask;
    private persistStatus;
    private clearAckTimer;
    private cancelTimers;
    private safeParse;
}
