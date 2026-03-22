import * as dns from 'node:dns';
import { LookupFunction } from 'node:net';
import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';
import { Op } from 'sequelize';
import {
  TELE_NOTIFIER_REPOSITORY,
  TENANT_REPOSITORY,
} from 'src/constants/database.const';
import { TeleNotifier } from 'src/database/models/tele-notifier.model';
import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;

  constructor(
    private configService: ConfigService,
    private logger: AppLoggerService,
    private postgresProvider: PostgresProvider,
    @Inject(TENANT_REPOSITORY)
    private tenantRepository: typeof Tenant,
    @Inject(TELE_NOTIFIER_REPOSITORY)
    private teleNotifierRepository: typeof TeleNotifier,
  ) {
    const token = this.configService.get<string>('telegram.token');
    if (!token) {
      throw new Error('TELEGRAM_TOKEN is not in env');
    }
    const customLookup: LookupFunction = (
      hostname: string,
      options: dns.LookupOptions,
      callback: (
        err: NodeJS.ErrnoException | null,
        address: string | dns.LookupAddress[],
        family?: number,
      ) => void,
    ): void => {
      return dns.lookup(hostname, { ...options, family: 4 }, callback);
    };
    this.bot = new TelegramBot(token, {
      request: { url: 'https://api.telegram.org', agentOptions: { lookup: customLookup } },
    });
  }

  onModuleInit() {
    this.registerCommand();
    this.setWebhook().catch((error) => {
      throw error;
    });
  }

  async setWebhook() {
    const appUrl = this.configService.get<string>('app.url');
    const token = this.configService.get<string>('telegram.token');
    await this.bot.setWebHook(`${appUrl}/telegram/${token}`);
  }

  processUpdate(update: TelegramBot.Update) {
    this.bot.processUpdate(update);
  }

  async sendMessage(
    chatId: number,
    text: string,
    options?: TelegramBot.SendMessageOptions,
  ) {
    try {
      await this.bot.sendMessage(chatId, text, options);
    }
    catch (error) {
      this.logger.error(
        `Send Telegram Message Error: ${(error as Error).message}`,
        (error as Error).stack,
        'SendTelegramMessage',
      );
    }
  }

  private async newSubscription(
    chatId: number,
    tenant_id: string,
    secret: string,
    context: string,
    chatThreadId?: number,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenant_id, secret },
        transaction,
      });
      if (!tenant) {
        await this.sendMessage(chatId, `🔐 App ID atau Secret tidak cocok`);
      }
      else {
        await this.teleNotifierRepository.create(
          {
            chat_id: chatId,
            tenant_id: tenant.id,
            context,
            chat_thread_id: chatThreadId,
            isEnabled: true,
          },
          { transaction },
        );

        await this.sendMessage(
          chatId,
          `🔔 Anda berhasil subscribe notifikasi ${tenant_id}`,
        );
      }
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      this.logger.error(
        `Telegram Error Command /subscribe: ${(error as Error).message}`,
        (error as Error).stack,
        'Telegram',
      );
      await this.sendMessage(chatId, `❗Terjadi kesalahan di server`);
    }
  }

  private async cancelSubscription(chatId: number, tenant_id: string) {
    try {
      const notifier = await this.teleNotifierRepository.findAll({
        where: { chat_id: chatId },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: [],
            required: true,
            where: { tenant_id },
          },
        ],
      });
      if (!notifier.length) {
        throw new NotFoundException();
      }

      const notifierIds = notifier.map(nt => nt.id);
      await this.teleNotifierRepository.destroy({
        where: { id: { [Op.in]: notifierIds } },
      });
      await this.sendMessage(
        chatId,
        `🗑️ Anda berhasil berhenti berlangganan dari tenant_id: ${tenant_id}`,
      );
    }
    catch (error) {
      this.logger.error(
        `Telegram Error Command /unsubscribe: ${(error as Error).message}`,
        (error as Error).stack,
        'Telegram',
      );
      if (error instanceof NotFoundException) {
        await this.sendMessage(
          chatId,
          `❗anda tidak subscribe notifikasi pada *${tenant_id}*`,
          { parse_mode: 'Markdown' },
        );
      }
      else {
        await this.sendMessage(chatId, `❗Terjadi kesalahan di server`);
      }
    }
  }

  private async getSubscriptionList(chatId: number) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const notifier = await this.teleNotifierRepository.findAll({
        where: { chat_id: chatId },
        transaction,
      });

      if (!notifier.length) {
        await this.sendMessage(chatId, '🔔 Anda tidak subscribe notifikasi');
      }
      else {
        // TODO algoritma sementara, nanti diubah jadi pakai keyboard button
        const tenantIds = [
          ...new Set(notifier.map(nt => nt.dataValues.tenant_id)),
        ];
        const tenants = await this.tenantRepository.findAll({
          where: { id: { [Op.in]: tenantIds } },
          transaction,
        });

        const subsMsg = tenants.reduce(
          (accumulator, currentValue, index) =>
            `${accumulator}\n${index + 1}. ${currentValue.id}`,
          '',
        );

        await this.sendMessage(
          chatId,
          `🔔 Anda subscribe notifikasi:\n${subsMsg}`,
        );
      }
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      this.logger.error(
        `Telegram Error Command /subscription_list: ${(error as Error).message}`,
        (error as Error).stack,
        'Telegram',
      );
      await this.sendMessage(chatId, `❗Terjadi kesalahan di server`);
    }
  }

  private registerCommand() {
    this.bot.onText(/\/subscribe (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const chatThreadId = msg.message_thread_id ?? undefined;
      const payload = match![1].split(' ');
      const tenant_id = payload[0];
      const secret = payload[1];
      const context = payload[2];
      void this.newSubscription(
        chatId,
        tenant_id,
        secret,
        context,
        chatThreadId,
      );
    });

    this.bot.onText(/\/unsubscribe (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const tenant_id = match![1];
      void this.cancelSubscription(chatId, tenant_id);
    });

    this.bot.onText(/\/subscription_list/, (msg) => {
      const chatId = msg.chat.id;
      void this.getSubscriptionList(chatId);
    });

    this.bot.on('message', (msg) => {
      if (
        msg.text
        && (msg.text.startsWith('/subscribe')
          || msg.text.startsWith('/unsubscribe')
          || msg.text.startsWith('/subscription_list'))
      ) {
        return;
      }
      const helpMessage = `
      👋 Halo! Saya adalah bot notifikasi .

      Untuk menerima notifikasi, gunakan:
      /subscribe TENANT_ID SECRET

      Untuk berhenti terima notifikasi, gunakan:
      /unsubscribe TENANT_ID

      Untuk melihat list notifikasi, gunakan:
      /subscription_list
      `;
      void this.sendMessage(msg.chat.id, helpMessage);
    });
  }
}
