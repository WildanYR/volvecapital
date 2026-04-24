import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Transaction as DbTransaction,
  Op,
  QueryTypes,
  WhereOptions,
} from 'sequelize';
import {
  ACCOUNT_PROFILE_REPOSITORY,
  ACCOUNT_REPOSITORY,
  ACCOUNT_USER_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  TRANSACTION_ITEM_REPOSITORY,
  TRANSACTION_REPOSITORY,
} from 'src/constants/database.const';
import { NETFLIX_RESET_PASSWORD } from 'src/constants/task.const';
import { AccountModifier } from 'src/database/models/account-modifier.model';
import { AccountProfile } from 'src/database/models/account-profile.model';
import { AccountUser } from 'src/database/models/account-user.model';
import { Account } from 'src/database/models/account.model';
import { Email } from 'src/database/models/email.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { TransactionItem } from 'src/database/models/transaction-item.model';
import { Transaction } from 'src/database/models/transaction.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { NetflixResetPasswordMetadata } from '../account/types/netflix-reset-password-metadata.type';
import { AppLoggerService } from '../logger/logger.service';
import { TaskQueueService } from '../task-queue/task-queue.service';
import { NetflixResetPasswordPayload } from '../task-queue/types/task-context.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { SnowflakeIdProvider } from '../utility/snowflake-id.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateAccountUserDto } from './dto/create-account-user.dto';
import { UpdateAccountUserDto } from './dto/update-account-user.dto';
import { IAccountUserGetFilter } from './filter/account-user-get.filter';

@Injectable()
export class AccountUserService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly paginationProvider: PaginationProvider,
    private readonly snowflakeIdProvider: SnowflakeIdProvider,
    private readonly postgresProvider: PostgresProvider,
    private readonly taskQueueService: TaskQueueService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: typeof Account,
    @Inject(ACCOUNT_USER_REPOSITORY)
    private readonly accountUserRepository: typeof AccountUser,
    @Inject(ACCOUNT_PROFILE_REPOSITORY)
    private readonly accountProfileRepository: typeof AccountProfile,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: typeof Transaction,
    @Inject(TRANSACTION_ITEM_REPOSITORY)
    private readonly transactionItemRepository: typeof TransactionItem,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IAccountUserGetFilter,
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

      const accountUsers = await this.accountUserRepository.findAndCountAll({
        where: whereOptions,
        order,
        limit,
        offset,
        include: [
          { model: AccountProfile, as: 'profile' },
          {
            model: Account,
            as: 'account',
            include: [
              {
                model: ProductVariant,
                as: 'product_variant',
                include: [{ model: Product, as: 'product' }],
              },
            ],
          },
        ],
        transaction,
      });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        accountUsers.rows,
        accountUsers.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, accountUserId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const accountUser = await this.accountUserRepository.findOne({
        where: { id: accountUserId },
        include: [
          { model: AccountProfile, as: 'profile' },
          {
            model: Account,
            as: 'account',
            include: [
              {
                model: ProductVariant,
                as: 'product_variant',
                include: [{ model: Product, as: 'product' }],
              },
            ],
          },
        ],
        transaction,
      });

      if (!accountUser) {
        throw new NotFoundException(
          `accountUser dengan id: ${accountUserId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return accountUser;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(
    tenantId: string,
    createAccountUserDto: CreateAccountUserDto,
    dbTransaction?: DbTransaction,
  ) {
    let accountUser: AccountUser | null;
    const {
      transaction: userTransaction,
      product_variant_id,
      account_profile_id,
      ...accountUserData
    } = createAccountUserDto;
    const transaction = dbTransaction || await this.postgresProvider.transaction();
    try {
      if (!dbTransaction) {
        await this.postgresProvider.setSchema(tenantId, transaction);
      }

      const userProfile: {
        account_id: string | null;
        account_profile_id: string | null;
      } = {
        account_id: null,
        account_profile_id: null,
      };

      const accountTable = 'account';
      const accountProfileTable = 'account_profile';
      const accountUserTable = 'account_user';
      const productVariantTable = 'product_variant';

      if (account_profile_id) {
        const accountProfile = await this.accountProfileRepository.findOne({
          where: { id: account_profile_id },
          transaction,
        });

        if (!accountProfile) {
          throw new NotFoundException('Account Profile not found');
        }

        const userCount = await this.accountUserRepository.count({
          where: { account_profile_id, status: 'active' },
          transaction,
        });

        if (userCount >= accountProfile.dataValues.max_user) {
          throw new UnprocessableEntityException(
            `Profil sudah penuh. maksimal: ${accountProfile.dataValues.max_user} user`,
          );
        }

        userProfile.account_id = accountProfile.dataValues.account_id;
        userProfile.account_profile_id = accountProfile.id;
      }
      else {
        // GENERATE PROFILE
        const sqlQuery = `WITH now_ts AS (
            SELECT NOW() AS current_time
          ),
          candidate_stats AS (
            SELECT
              ap.id AS profile_id,
              ap.account_id,
              pv.cooldown,
              ap.max_user,
              COUNT(au.id) AS current_user_count,
              MAX(au.created_at) AS last_user_created_at
            FROM
              ${accountProfileTable} AS ap
              JOIN ${accountTable} AS a ON ap.account_id = a.id
              JOIN ${productVariantTable} AS pv ON a.product_variant_id = pv.id
              LEFT JOIN ${accountUserTable} AS au
                ON ap.id = au.account_profile_id
                AND au.status = 'active'
            WHERE
              a.product_variant_id = ?
              AND ap.allow_generate = true
              AND a.status != 'disable'
              AND a.freeze_until IS NULL
            GROUP BY
              ap.id, pv.cooldown, ap.max_user, ap.account_id
          )
          SELECT
            cs.profile_id AS "candidateProfileId",
            cs.account_id AS "accountId",
            CASE
              WHEN (
                cs.last_user_created_at IS NULL OR
                n.current_time - cs.last_user_created_at > (cs.cooldown / 1000) * INTERVAL '1 second'
              ) THEN 'available'
              ELSE 'cooldown'
            END AS status
          FROM
            candidate_stats AS cs
            CROSS JOIN now_ts n
          WHERE
            cs.current_user_count < cs.max_user
          ORDER BY
            CASE
              WHEN (
                cs.last_user_created_at IS NULL OR
                n.current_time - cs.last_user_created_at > (cs.cooldown / 1000) * INTERVAL '1 second'
              ) THEN 1
              ELSE 2
            END ASC,
            CASE
              WHEN cs.current_user_count > 0 THEN 0
              ELSE 1
            END ASC,
            cs.profile_id ASC
          LIMIT 1;`;
        const results = (await this.postgresProvider.rawQuery(sqlQuery, {
          transaction,
          raw: true,
          type: QueryTypes.SELECT,
          replacements: [product_variant_id],
        })) as {
          candidateProfileId: string;
          accountId: string;
          status: string;
        }[];

        if (!results.length) {
          throw new NotFoundException('NOT_AVAILABLE');
        }

        if (results[0].status === 'cooldown') {
          throw new UnprocessableEntityException('COOLDOWN');
        }

        userProfile.account_id = String(results[0].accountId);
        userProfile.account_profile_id = String(results[0].candidateProfileId);
      }

      if (!userProfile.account_id || !userProfile.account_profile_id) {
        throw new NotFoundException('NOT_AVAILABLE');
      }

      const productVariant = await this.productVariantRepository.findOne({ where: { id: product_variant_id }, transaction });

      if (!productVariant) {
        throw new NotFoundException('NOT_AVAILABLE');
      }

      const expired_at = createAccountUserDto.expired_at
        ? createAccountUserDto.expired_at
        : new Date(Date.now() + Number.parseInt(productVariant.dataValues.duration as unknown as string));

      const newUser = await this.accountUserRepository.create(
        {
          name: accountUserData.name,
          status: accountUserData.status ? accountUserData.status : 'active',
          account_id: userProfile.account_id,
          account_profile_id: userProfile.account_profile_id,
          expired_at,
        },
        { transaction },
      );

      accountUser = await this.accountUserRepository.findOne({
        where: { id: newUser.id },
        attributes: ['id'],
        transaction,
      });

      if (!accountUser) {
        throw new NotFoundException('Account user not found');
      }

      if (userTransaction) {
        const accountWithProduct = await this.accountRepository.findOne({
          where: { id: userProfile.account_id },
          attributes: ['id'],
          include: [
            {
              model: ProductVariant,
              as: 'product_variant',
              required: true,
              attributes: ['id', 'name'],
              include: [
                {
                  model: Product,
                  as: 'product',
                  required: true,
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
          raw: true,
          nest: true,
          transaction,
        });

        if (!accountWithProduct) {
          throw new BadRequestException(
            'Gagal membuat transaksi: Product not found',
          );
        }

        const transactionId = this.snowflakeIdProvider.generateId();
        const newUserTransaction = await this.transactionRepository.create(
          {
            id: transactionId,
            customer: accountUserData.name,
            ...userTransaction,
          },
          { transaction },
        );

        const productName = `${accountWithProduct.product_variant.product.name} ${accountWithProduct.product_variant.name}`;
        await this.transactionItemRepository.create(
          {
            transaction_id: newUserTransaction.id,
            name: productName,
            account_user_id: accountUser.id,
          },
          { transaction },
        );
      }

      const accountUpdateQuery = `
          UPDATE ${accountTable}
          SET
              status = 'active',
              batch_start_date = COALESCE(${accountTable}.batch_start_date, NOW()),
              batch_end_date = GREATEST(${accountTable}.batch_end_date, :expiredAt)
          FROM
              ${productVariantTable} AS pv
          WHERE
              ${accountTable}.product_variant_id = pv.id
              AND ${accountTable}.id = :accountId
              AND pv.id = :pvId;
      `;

      await this.postgresProvider.rawQuery(accountUpdateQuery, {
        transaction,
        type: QueryTypes.UPDATE,
        replacements: {
          expiredAt: expired_at,
          accountId: userProfile.account_id,
          pvId: product_variant_id,
        },
      });

      accountUser = await this.accountUserRepository.findOne({
        where: { id: newUser.id },
        include: [
          { model: AccountProfile, as: 'profile' },
          {
            model: Account,
            as: 'account',
            include: [
              { model: Email, as: 'email' },
              {
                model: ProductVariant,
                as: 'product_variant',
                include: [{ model: Product, as: 'product' }],
              },
              {
                model: AccountModifier,
                as: 'modifier',
                where: { enabled: true },
                required: false,
              },
            ],
          },
        ],
        transaction,
      });

      if (!accountUser) {
        throw new NotFoundException('Account user not found');
      }

      if (!dbTransaction) {
        await transaction.commit();
      }
    }
    catch (error) {
      if (!dbTransaction) {
        await transaction.rollback();
      }
      throw error;
    }

    if (accountUser && accountUser.dataValues.account.batch_end_date) {
      const netflixResetPasswordModifier
        = accountUser.dataValues.account.modifier?.find(
          mod => mod.modifier_id === NETFLIX_RESET_PASSWORD,
        );
      if (
        netflixResetPasswordModifier
        && netflixResetPasswordModifier.metadata
      ) {
        try {
          const metadata = JSON.parse(
            netflixResetPasswordModifier.metadata,
          ) as NetflixResetPasswordMetadata;
          const passwordList = metadata.password_list
            ? metadata.password_list
                .replaceAll(' ', '')
                .split(',')
                .filter(
                  pwd =>
                    pwd !== accountUser.dataValues.account.account_password,
                )
            : [];

          if (!passwordList.length) {
            throw new Error('List password belum diisi');
          }

          const randomIndex = Math.floor(Math.random() * passwordList.length);
          const newPassword = passwordList[randomIndex];

          await this.taskQueueService.upsert([
            {
              context: NETFLIX_RESET_PASSWORD,
              execute_at: accountUser.dataValues.account.batch_end_date,
              subject_id: accountUser.dataValues.account.id,
              tenant_id: tenantId,
              status: 'QUEUED',
              payload: JSON.stringify({
                id: accountUser.dataValues.id,
                email: accountUser.dataValues.account.email.email,
                password: accountUser.dataValues.account.account_password,
                newPassword,
              } as NetflixResetPasswordPayload),
            },
          ]);
        }
        catch (error) {
          const accountName = `${accountUser.dataValues.account.email.email} (${accountUser.dataValues.account.product_variant.product.name} ${accountUser.dataValues.account.product_variant.name})`;
          this.logger.error(
            `Error saat mendaftarkan Task Queue pada akun ${accountName}: ${(error as Error).message}`,
            (error as Error).stack,
            'CreateAccountUser',
          );
        }
      }
    }

    return accountUser;
  }

  async update(
    tenantId: string,
    accountUserId: string,
    updateAccountUserDto: UpdateAccountUserDto,
  ) {
    const { account_profile_id, ...accountUserData } = updateAccountUserDto;

    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const accountUser = await this.accountUserRepository.findOne({
        where: { id: accountUserId },
        transaction,
      });

      if (!accountUser) {
        throw new NotFoundException(
          `accountUser dengan id: ${accountUserId} tidak ditemukan`,
        );
      }

      const updateData: {
        name?: string;
        status?: string;
        account_id?: string;
        account_profile_id?: string;
        expired_at?: Date;
      } = { ...accountUserData };

      if (account_profile_id) {
        const accountProfile = await this.accountProfileRepository.findOne({
          where: { id: account_profile_id },
          transaction,
        });

        if (!accountProfile) {
          throw new NotFoundException('Account Profile not found');
        }

        const userCount = await this.accountUserRepository.count({
          where: { account_profile_id, status: 'active' },
          transaction,
        });

        if (userCount >= accountProfile.dataValues.max_user) {
          throw new UnprocessableEntityException(
            `Profil sudah penuh. maksimal: ${accountProfile.dataValues.max_user} user`,
          );
        }

        updateData.account_id = accountProfile.account_id;
        updateData.account_profile_id = account_profile_id;
      }

      await accountUser.update(updateData, { transaction });

      if (updateData.expired_at) {
        await this.accountRepository.update({
          batch_end_date: updateData.expired_at,
        }, {
          where: {
            id: accountUser.dataValues.account_id,
            batch_end_date: { [Op.lt]: updateData.expired_at },
          },
          transaction,
        });
      }

      const accountUserUpdate = await this.accountUserRepository.findOne({
        where: { id: accountUserId },
        include: [
          { model: AccountProfile, as: 'profile' },
          {
            model: Account,
            as: 'account',
            include: [
              {
                model: ProductVariant,
                as: 'product_variant',
                include: [{ model: Product, as: 'product' }],
              },
            ],
          },
        ],
        transaction,
      });

      await transaction.commit();
      return accountUserUpdate;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, accountUserId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const accountUser = await this.accountUserRepository.findOne({
        where: { id: accountUserId },
        transaction,
      });

      if (!accountUser) {
        throw new NotFoundException(
          `accountUser dengan id: ${accountUserId} tidak ditemukan`,
        );
      }

      await accountUser.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // TODO: move to other account
}
