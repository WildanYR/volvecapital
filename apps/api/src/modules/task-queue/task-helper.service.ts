import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from 'src/constants/database.const';
import { NETFLIX_REQ_RESET_PASSWORD } from 'src/constants/email-subject.const';
import { Account } from 'src/database/models/account.model';
import { Email } from 'src/database/models/email.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { SyslogService } from '../logger/syslog.service';
import { SocketGateway } from '../socket/socket.gateway';
import { EmailParser } from '../utility/email-parser.provider';
import { AccountSubsEndNotifyPayload, AccountUnfreezePayload, NetflixAutoReloadPayload, NetflixResetPasswordPayload } from './types/task-context.type';

@Injectable()
export class TaskHelperService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly emailParser: EmailParser,
    private readonly sysLogService: SyslogService,
    private readonly socketGateway: SocketGateway,
    private readonly postgresProvider: PostgresProvider,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepository: typeof Account
  ) {}

  async unfreezeAccount(tenantId: string, payload: AccountUnfreezePayload) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const account = await this.accountRepository.findOne({
        where: { id: payload.accountId },
        transaction,
      });
      if (!account)
        return;
      await account.update({ freeze_until: null }, { transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async accountSubsEndNotify(tenantId: string, payload: AccountSubsEndNotifyPayload) {
    this.sysLogService.logToDb(tenantId, { level: 'REMINDER', context: 'AccountSubsEnd', message: payload.message });
  }

  async netflixResetPassword(taskId: string, tenantId: string, payload: NetflixResetPasswordPayload) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const account = await this.accountRepository.findOne({
        include: [{
          model: Email,
          as: 'email',
          where: { email: payload.email },
          required: true,
        }],
        transaction,
      });
      if (!account) {
        throw new NotFoundException(`Account with email: ${payload.email} not found`);
      }
      await transaction.commit();

      const clientId = await this.socketGateway.dispatchTask(taskId, tenantId, {
        module: 'netflix',
        type: 'resetPassword',
        payload,
      });

      if (clientId) {
        const eventName = `${this.emailParser.sanitizeEmail(payload.email)}:${NETFLIX_REQ_RESET_PASSWORD}`;
        this.socketGateway.subscribeClientToEvent(clientId, eventName);
      }
    }
    catch (error) {
      await transaction.rollback();
      this.logger.error(error.message, error.stack, 'TaskProcessorNetflixResetPassword');
    }
  }

  async netflixAutoReload(taskId: string, tenantId: string, payload: NetflixAutoReloadPayload) {
    try {
      // Dispatch task ke bot via socket
      const clientId = await this.socketGateway.dispatchTask(taskId, tenantId, {
        module: 'netflix',
        type: 'autoReload',
        payload,
      });

      if (clientId) {
        // Subscribe bot ke event konfirmasi top-up dari dashboard
        const topupEventName = `${payload.accountId}:NETFLIX_TOPUP_CONFIRM`;
        this.socketGateway.subscribeClientToEvent(clientId, topupEventName);
      }
    }
    catch (error) {
      this.logger.error(error.message, error.stack, 'TaskProcessorNetflixAutoReload');
    }
  }
}
