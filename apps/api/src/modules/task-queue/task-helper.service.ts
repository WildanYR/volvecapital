import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from 'src/constants/database.const';
import { NETFLIX_REQ_RESET_PASSWORD } from 'src/constants/email-subject.const';
import { Account } from 'src/database/models/account.model';
import { Email } from 'src/database/models/email.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { SyslogService } from '../logger/syslog.service';
import { SocketGateway } from '../socket/socket.gateway';
import { TeleNotifierService } from '../tele-notifier/tele-notifier.service';
import { EmailParser } from '../utility/email-parser.provider';
import {
  AccountSubsEndNotifyPayload,
  AccountUnfreezePayload,
  NetflixResetPasswordPayload,
} from './types/task-context.type';

@Injectable()
export class TaskHelperService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly emailParser: EmailParser,
    private readonly sysLogService: SyslogService,
    private readonly teleNotifierService: TeleNotifierService,
    private readonly socketGateway: SocketGateway,
    private readonly postgresProvider: PostgresProvider,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: typeof Account,
  ) {}

  async unfreezeAccount(tenantId: string, payload: AccountUnfreezePayload) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const account = await this.accountRepository.findOne({
        where: { id: payload.accountId },
        transaction,
      });
      if (account) {
        await account.update({ freeze_until: null }, { transaction });
      }
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async accountSubsEndNotify(
    tenantId: string,
    payload: AccountSubsEndNotifyPayload,
  ) {
    this.teleNotifierService.sendNotification(tenantId, payload);
    this.sysLogService.logToDb(tenantId, {
      level: 'REMINDER',
      context: 'AccountSubsEnd',
      message: payload.message,
    });
  }

  async netflixResetPassword(
    taskId: string,
    tenantId: string,
    payload: NetflixResetPasswordPayload,
  ) {
    if (!payload.accountId || !payload.email) {
      const missingFields = [
        !payload.accountId ? 'accountId' : null,
        !payload.email ? 'email' : null,
      ]
        .filter(Boolean)
        .join(', ');

      const message = `Skip dispatch NETFLIX_RESET_PASSWORD task ${taskId}: missing required payload field(s): ${missingFields}`;
      this.logger.error(
        message,
        undefined,
        'TaskProcessorNetflixResetPassword',
      );
      await this.logNetflixDispatchIssue(tenantId, message);
      return;
    }

    let transactionCommitted = false;
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const account = await this.accountRepository.findOne({
        where: { id: payload.accountId },
        include: [
          {
            model: Email,
            as: 'email',
            where: { email: payload.email },
            required: true,
          },
        ],
        transaction,
      });
      if (!account) {
        throw new NotFoundException(
          `Account with id: ${payload.accountId} and email: ${payload.email} not found`,
        );
      }
      await transaction.commit();
      transactionCommitted = true;

      const clientId = await this.socketGateway.dispatchTask(taskId, tenantId, {
        module: 'netflix',
        type: 'resetPassword',
        maxRetries: 0,
        payload,
      });

      if (clientId) {
        const eventName = `${this.emailParser.sanitizeEmail(payload.email)}:${NETFLIX_REQ_RESET_PASSWORD}`;
        this.socketGateway.subscribeClientToEvent(clientId, eventName);
      }
    }
    catch (error) {
      if (!transactionCommitted) {
        await transaction.rollback();
      }
      this.logger.error(
        (error as Error).message,
        (error as Error).stack,
        'TaskProcessorNetflixResetPassword',
      );
      await this.logNetflixDispatchIssue(
        tenantId,
        `[${tenantId}] Reset Password Netflix dispatch failed for accountId: ${payload.accountId}, email: ${payload.email}. ${(error as Error).message}`,
      );
    }
  }

  private async logNetflixDispatchIssue(tenantId: string, message: string) {
    try {
      await this.sysLogService.logToDb(tenantId, {
        level: 'ERROR',
        context: 'TaskProcessorNetflixResetPassword',
        message,
      });
    }
    catch (error) {
      this.logger.error(
        `Failed to write Netflix dispatch issue to syslog: ${(error as Error).message}`,
        (error as Error).stack,
        'TaskProcessorNetflixResetPassword',
      );
    }
  }
}
