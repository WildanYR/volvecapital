import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { EMAIL_SUBJECT_REPOSITORY } from 'src/constants/database.const';
import { EmailSubject } from 'src/database/models/email-subject.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateEmailSubjectDto } from './dto/create-email-subject.dto';
import { UpdateEmailSubjectDto } from './dto/update-email-subject.dto';
import { IEmailSubjectGetFilter } from './filter/email-subject-get';

@Injectable()
export class EmailSubjectService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_SUBJECT_REPOSITORY) private readonly emailSubjectRepository: typeof EmailSubject,
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IEmailSubjectGetFilter,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.subject) {
        whereOptions.subject = { [Op.iLike]: `%${filter.subject}%` };
      }
      if (filter?.context) {
        whereOptions.context = { [Op.iLike]: `%${filter.context}%` };
      }

      const emails = await this.emailSubjectRepository.findAndCountAll({
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

  async findOne(tenantId: string, emailSubjectId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const email = await this.emailSubjectRepository.findOne({
        where: { id: emailSubjectId },
        transaction,
      });

      if (!email) {
        throw new NotFoundException(
          `email subject dengan id: ${emailSubjectId} tidak ditemukan`,
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

  async create(tenantId: string, createEmailSubjectDto: CreateEmailSubjectDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const existingEmail = await this.emailSubjectRepository.count({
        where: { subject: createEmailSubjectDto.subject },
        transaction,
      });

      if (existingEmail) {
        throw new BadRequestException('Email subject sudah ada');
      }

      const newEmail = await this.emailSubjectRepository.create(
        { ...createEmailSubjectDto },
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
    emailSubjectId: string,
    updateEmailDto: UpdateEmailSubjectDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const email = await this.emailSubjectRepository.findOne({
        where: { id: emailSubjectId },
        transaction,
      });

      if (!email) {
        throw new NotFoundException(
          `email subject dengan id: ${emailSubjectId} tidak ditemukan`,
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

  async remove(tenantId: string, emailSubjectId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const email = await this.emailSubjectRepository.findOne({
        where: { id: emailSubjectId },
        transaction,
      });

      if (!email) {
        throw new NotFoundException(
          `email dengan id: ${emailSubjectId} tidak ditemukan`,
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
