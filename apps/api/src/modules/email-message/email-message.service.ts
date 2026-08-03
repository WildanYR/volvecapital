import { Inject, Injectable } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { EMAIL_MESSAGE_REPOSITORY } from 'src/constants/database.const';
import { DatabaseModule } from 'src/database/database.module';
import { EmailMessage } from 'src/database/models/email-message.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { IEmailMessageGetFilter } from './filter/email-message-get.filter';

@Injectable()
export class EmailMessageService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_MESSAGE_REPOSITORY)
    private readonly emailMessageRepository: typeof EmailMessage,
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IEmailMessageGetFilter,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { limit, offset } = this.paginationProvider.generatePaginationQuery(
        pagination,
      );

      console.log(`[DEBUG] Fetching emails for tenant: ${tenantId}, limit: ${limit}, offset: ${offset}`);

      const whereOptions: WhereOptions = {
        tenant_id: tenantId,
        created_at: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 60 * 1000), // Last 5 hours
        },
      };
      if (filter?.recipient_email) {
        whereOptions.recipient_email = { [Op.iLike]: `%${filter.recipient_email}%` };
      }

      const emailMessages = await this.emailMessageRepository.findAndCountAll({
        where: whereOptions,
        order: [['created_at', 'DESC']],
        limit,
        offset,
        transaction,
      });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        emailMessages.rows,
        emailMessages.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async cleanupOldData(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      
      const deletedCount = await this.emailMessageRepository.destroy({
        where: {
          tenant_id: tenantId,
          created_at: {
            [Op.lt]: new Date(Date.now() - 5 * 60 * 60 * 1000), // Older than 5 hours
          },
        },
        transaction,
      });

      await transaction.commit();
      return { success: true, deleted: deletedCount };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
