import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';
import { TeleNotifier } from 'src/database/models/tele-notifier.model';
import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
export declare class TelegramService implements OnModuleInit {
    private configService;
    private logger;
    private postgresProvider;
    private tenantRepository;
    private teleNotifierRepository;
    private bot;
    constructor(configService: ConfigService, logger: AppLoggerService, postgresProvider: PostgresProvider, tenantRepository: typeof Tenant, teleNotifierRepository: typeof TeleNotifier);
    onModuleInit(): void;
    setWebhook(): Promise<void>;
    processUpdate(update: TelegramBot.Update): void;
    sendMessage(chatId: number, text: string, options?: TelegramBot.SendMessageOptions): Promise<void>;
    private newSubscription;
    private cancelSubscription;
    private getSubscriptionList;
    private registerCommand;
}
