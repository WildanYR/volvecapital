import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { ACCOUNT_PROFILE_REPOSITORY } from 'src/constants/database.const';
import { AccountProfile } from 'src/database/models/account-profile.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateAccountProfileDto } from './dto/create-account-profile.dto';
import { UpdateAccountProfileDto } from './dto/update-account-profile.dto';
import { IAccountProfileGetFilter } from './filter/account-profile-get.filter';

@Injectable()
export class AccountProfileService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(ACCOUNT_PROFILE_REPOSITORY)
    private readonly accountProfileRepository: typeof AccountProfile,
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IAccountProfileGetFilter,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.name) {
        whereOptions.name = { [Op.iLike]: `%${filter.name}%` };
      }
      if (filter?.account_id) {
        whereOptions.account_id = filter.account_id;
      }

      const accountProfiles
        = await this.accountProfileRepository.findAndCountAll({
          where: whereOptions,
          order,
          limit,
          offset,
          transaction,
        });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        accountProfiles.rows,
        accountProfiles.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, accountProfileId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const accountProfile = await this.accountProfileRepository.findOne({
        where: { id: accountProfileId },
        transaction,
      });

      if (!accountProfile) {
        throw new NotFoundException(
          `accountProfile dengan id: ${accountProfileId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return accountProfile;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(
    tenantId: string,
    createAccountProfileDto: CreateAccountProfileDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const profile = await this.accountProfileRepository.create(
        {
          ...createAccountProfileDto,
        },
        { transaction },
      );
      await transaction.commit();
      return profile;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(
    tenantId: string,
    accountProfileId: string,
    updateAccountProfileDto: UpdateAccountProfileDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const accountProfile = await this.accountProfileRepository.findOne({
        where: { id: accountProfileId },
        transaction,
      });

      if (!accountProfile) {
        throw new NotFoundException(
          `accountProfile dengan id: ${accountProfileId} tidak ditemukan`,
        );
      }

      await accountProfile.update(
        { ...updateAccountProfileDto },
        { transaction },
      );
      await transaction.commit();
      return accountProfile;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, accountProfileId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const accountProfile = await this.accountProfileRepository.findOne({
        where: { id: accountProfileId },
        transaction,
      });

      if (!accountProfile) {
        throw new NotFoundException(
          `accountProfile dengan id: ${accountProfileId} tidak ditemukan`,
        );
      }

      await accountProfile.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
