import { Inject, Injectable } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { EMAIL_MESSAGE_TS_REPOSITORY } from 'src/constants/database.const';
import { EmailMessageTS } from 'src/database/models/email-message-ts.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { IEmailMessageGetFilter } from './filter/email-message-get.filter';

@Injectable()
export class EmailMessageService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_MESSAGE_TS_REPOSITORY)
    private readonly emailMessageTSRepository: typeof EmailMessageTS,
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

      const whereOptions: WhereOptions = {};
      if (filter?.from_email) {
        whereOptions.from_email = { [Op.iLike]: `%${filter.from_email}%` };
      }

      const emailMessages = await this.emailMessageTSRepository.findAndCountAll({
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
}
