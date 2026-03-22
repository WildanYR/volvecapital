import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { TelegramService } from './telegram.service';
export declare class TelegramController {
    private configService;
    private telegramService;
    constructor(configService: ConfigService, telegramService: TelegramService);
    telegramWebhook(token: string, update: TelegramBot.Update): {
        status: string;
    };
}
