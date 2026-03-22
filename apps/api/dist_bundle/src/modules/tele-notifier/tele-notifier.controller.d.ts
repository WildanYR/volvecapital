import { AppRequest } from 'src/types/app-request.type';
import { SendNotificationDto } from './dto/send-notification.dto';
import { TeleNotifierService } from './tele-notifier.service';
export declare class TeleNotifierController {
    private teleNotifierService;
    constructor(teleNotifierService: TeleNotifierService);
    sendNotification(sendNotificationDto: SendNotificationDto, request: AppRequest): Promise<void>;
}
