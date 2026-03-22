import { Account } from 'src/database/models/account.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { SyslogService } from '../logger/syslog.service';
import { SocketGateway } from '../socket/socket.gateway';
import { TeleNotifierService } from '../tele-notifier/tele-notifier.service';
import { EmailParser } from '../utility/email-parser.provider';
import { AccountSubsEndNotifyPayload, AccountUnfreezePayload, NetflixResetPasswordPayload } from './types/task-context.type';
export declare class TaskHelperService {
    private readonly logger;
    private readonly emailParser;
    private readonly sysLogService;
    private readonly teleNotifierService;
    private readonly socketGateway;
    private readonly postgresProvider;
    private readonly accountRepository;
    constructor(logger: AppLoggerService, emailParser: EmailParser, sysLogService: SyslogService, teleNotifierService: TeleNotifierService, socketGateway: SocketGateway, postgresProvider: PostgresProvider, accountRepository: typeof Account);
    unfreezeAccount(tenantId: string, payload: AccountUnfreezePayload): Promise<void>;
    accountSubsEndNotify(tenantId: string, payload: AccountSubsEndNotifyPayload): Promise<void>;
    netflixResetPassword(taskId: string, tenantId: string, payload: NetflixResetPasswordPayload): Promise<void>;
}
