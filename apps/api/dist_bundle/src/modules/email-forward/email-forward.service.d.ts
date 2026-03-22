import { EmailSubject } from 'src/database/models/email-subject.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { SocketGateway } from '../socket/socket.gateway';
import { EmailParser } from '../utility/email-parser.provider';
import { RecieveEmailDto } from './dto/recieve-email.dto';
export declare class EmailForwardService {
    private readonly logger;
    private readonly emailParser;
    private readonly socketGateway;
    private readonly postgresProvider;
    private readonly emailSubjectRepository;
    constructor(logger: AppLoggerService, emailParser: EmailParser, socketGateway: SocketGateway, postgresProvider: PostgresProvider, emailSubjectRepository: typeof EmailSubject);
    recieveEmail(payload: RecieveEmailDto): Promise<void>;
    getEmailSubject(): Promise<{
        subjects: string[];
    } | undefined>;
}
