import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { EMAIL_REPOSITORY } from 'src/constants/database.const';
import { Email } from 'src/database/models/email.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { IEmailGetFilter } from './filter/email-get.filter';

@Injectable()
export class EmailService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_REPOSITORY) private readonly emailRepository: typeof Email,
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IEmailGetFilter,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.email) {
        whereOptions.email = { [Op.iLike]: `%${filter.email}%` };
      }

      const emails = await this.emailRepository.findAndCountAll({
        where: whereOptions,
        order,
        limit,
        offset,
        transaction,
      });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        emails.rows,
        emails.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, emailId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const email = await this.emailRepository.findOne({
        where: { id: emailId },
        transaction,
      });

      if (!email) {
        throw new NotFoundException(
          `email dengan id: ${emailId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return email;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(tenantId: string, createEmailDto: CreateEmailDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const existingEmail = await this.emailRepository.count({
        where: { email: createEmailDto.email },
        transaction,
      });

      if (existingEmail) {
        throw new BadRequestException('Email sudah ada');
      }

      const newEmail = await this.emailRepository.create(
        { ...createEmailDto },
        { transaction },
      );
      await transaction.commit();
      return newEmail;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(
    tenantId: string,
    emailId: string,
    updateEmailDto: UpdateEmailDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const email = await this.emailRepository.findOne({
        where: { id: emailId },
        transaction,
      });

      if (!email) {
        throw new NotFoundException(
          `email dengan id: ${emailId} tidak ditemukan`,
        );
      }

      await email.update({ ...updateEmailDto }, { transaction });
      await transaction.commit();
      return email;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, emailId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const email = await this.emailRepository.findOne({
        where: { id: emailId },
        transaction,
      });

      if (!email) {
        throw new NotFoundException(
          `email dengan id: ${emailId} tidak ditemukan`,
        );
      }
      await email.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
