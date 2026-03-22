import { Inject, Injectable } from '@nestjs/common';
import { TELE_NOTIFIER_REPOSITORY } from 'src/constants/database.const';
import { TeleNotifier } from 'src/database/models/tele-notifier.model';
import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { TelegramService } from '../telegram/telegram.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class TeleNotifierService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    @Inject(TELE_NOTIFIER_REPOSITORY)
    private teleNotifierRepository: typeof TeleNotifier,
    private telegramService: TelegramService,
  ) {}

  async sendNotification(
    tenantId: string,
    sendNotificationDto: SendNotificationDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const notifier = await this.teleNotifierRepository.findAll({
        where: { context: sendNotificationDto.context, tenant_id: tenantId },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            required: true,
          },
        ],
        transaction,
      });

      if (notifier.length) {
        const notificationMessage = `*[${tenantId}]*\n\n${sendNotificationDto.message}`;

        for (const sub of notifier) {
          await this.telegramService.sendMessage(
            sub.dataValues.chat_id,
            notificationMessage,
            {
              parse_mode: 'Markdown',
              message_thread_id: sub.chat_thread_id,
            },
          );
        }
      }

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
