import { Inject, Injectable } from '@nestjs/common';
import { WhereOptions } from 'sequelize';
import { SYSLOG_REPOSITORY } from 'src/constants/database.const';
import { Syslog } from 'src/database/models/syslog.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateLogDto } from './dto/create-log.dto';
import { ILogGetFilter } from './filter/log-get.filter';

@Injectable()
export class SyslogService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(SYSLOG_REPOSITORY) private readonly syslogRepository: typeof Syslog
  ) {}

  async getLogWithPagination(tenantId: string, pagination?: BaseGetAllUrlQuery, filter?: ILogGetFilter) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const { limit, offset } = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.level) {
        whereOptions.level = filter.level;
      }

      if (filter?.context) {
        whereOptions.context = filter.context;
      }

      const logs = await this.syslogRepository.findAndCountAll({
        where: { ...whereOptions, tenant_id: tenantId },
        order: [
          ['created_at', 'DESC'],
        ],
        limit,
        offset,
        transaction,
      });

      await transaction.commit();

      return this.paginationProvider.generatePaginationResponse(
        logs.rows,
        logs.count,
        pagination
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getSyslogWithPagination(pagination?: BaseGetAllUrlQuery, filter?: ILogGetFilter) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const { limit, offset } = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.level) {
        whereOptions.level = filter.level;
      }

      if (filter?.context) {
        whereOptions.context = filter.context;
      }

      const logs = await this.syslogRepository.findAndCountAll({
        where: { ...whereOptions, tenant_id: null },
        order: [
          ['created_at', 'DESC'],
        ],
        limit,
        offset,
        transaction,
      });

      await transaction.commit();

      return this.paginationProvider.generatePaginationResponse(
        logs.rows,
        logs.count,
        pagination
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async logToDb(tenantId: string, createLogDto: CreateLogDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const { created_at, ...logData } = createLogDto;

      await this.syslogRepository.create({
        ...logData,
        created_at: created_at || new Date(),
        tenant_id: tenantId,
      }, { transaction });

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
