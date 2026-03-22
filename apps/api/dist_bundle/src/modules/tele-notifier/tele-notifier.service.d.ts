import { TeleNotifier } from 'src/database/models/tele-notifier.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { TelegramService } from '../telegram/telegram.service';
import { SendNotificationDto } from './dto/send-notification.dto';
export declare class TeleNotifierService {
    private readonly postgresProvider;
    private teleNotifierRepository;
    private telegramService;
    constructor(postgresProvider: PostgresProvider, teleNotifierRepository: typeof TeleNotifier, telegramService: TelegramService);
    sendNotification(tenantId: string, sendNotificationDto: SendNotificationDto): Promise<void>;
}
