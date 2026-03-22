import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import {
  ACCOUNT_USER_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  TRANSACTION_ITEM_REPOSITORY,
  TRANSACTION_REPOSITORY,
} from 'src/constants/database.const';
import { AccountProfile } from 'src/database/models/account-profile.model';
import {
  AccountUser,
  AccountUserAttributes,
} from 'src/database/models/account-user.model';
import { Account } from 'src/database/models/account.model';
import { Email } from 'src/database/models/email.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import {
  TransactionItem,
  TransactionItemCreationAttributes,
} from 'src/database/models/transaction-item.model';
import {
  Transaction,
  TransactionAttributes,
} from 'src/database/models/transaction.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AccountUserService } from '../account-user/account-user.service';
import { DateConverterProvider } from '../utility/date-converter.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { SnowflakeIdProvider } from '../utility/snowflake-id.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ITransactionGetFilter } from './filter/transaction-get.filter';

@Injectable()
export class TransactionService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly snowflakeIdProvider: SnowflakeIdProvider,
    private readonly dateConverterProvider: DateConverterProvider,
    private readonly accountUserService: AccountUserService,
    private readonly postgresProvider: PostgresProvider,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: typeof Transaction,
    @Inject(TRANSACTION_ITEM_REPOSITORY)
    private readonly transactionItemRepository: typeof TransactionItem,
    @Inject(ACCOUNT_USER_REPOSITORY)
    private readonly accountUserRepository: typeof AccountUser,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: ITransactionGetFilter,
  ) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.customer) {
        whereOptions.customer = { [Op.iLike]: `%${filter.customer}%` };
      }
      if (filter?.platform) {
        whereOptions.platform = { [Op.iLike]: `%${filter.platform}%` };
      }
      if (filter?.from_date || filter?.to_date) {
        let startDate: Date;
        let endDate: Date;

        if (filter.from_date) {
          startDate = filter.from_date;
        }
        else {
          startDate = new Date(0);
        }

        if (filter.to_date) {
          endDate = filter.to_date;
        }
        else {
          endDate = new Date();
        }

        whereOptions.created_at = {
          [Op.between]: [
            this.dateConverterProvider.getStartOfTheDayDate(startDate),
            this.dateConverterProvider.getEndOfTheDayDate(endDate),
          ],
        };
      }

      const transactions = await this.transactionRepository.findAndCountAll({
        where: whereOptions,
        order: !pagination?.order_by ? [['created_at', 'DESC']] : order,
        limit,
        offset,
        distinct: true,
        include: [
          {
            model: TransactionItem,
            as: 'items',
            include: [
              {
                model: AccountUser,
                as: 'user',
                include: [
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
                    ],
                  },
                  {
                    model: AccountProfile,
                    as: 'profile',
                  },
                ],
              },
            ],
          },
        ],
        transaction: tx,
      });

      await tx.commit();
      return this.paginationProvider.generatePaginationResponse(
        transactions.rows,
        transactions.count,
        pagination,
      );
    }
    catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, transactionId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
        include: [
          {
            model: TransactionItem,
            as: 'items',
            include: [
              {
                model: AccountUser,
                as: 'user',
                include: [
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
                    ],
                  },
                  {
                    model: AccountProfile,
                    as: 'profile',
                  },
                ],
              },
            ],
          },
        ],
        transaction: tx,
      });

      if (!transaction) {
        throw new NotFoundException(
          `transaction dengan id: ${transactionId} tidak ditemukan`,
        );
      }

      await tx.commit();
      return transaction;
    }
    catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async create(
    tenantId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<{
    transaction?: TransactionAttributes;
    account_user: (
      | AccountUserAttributes
      | {
        availability_status: 'NOT_AVAILABLE' | 'COOLDOWN';
        product_variant_id: string;
      }
    )[];
  }> {
    const { id, items, ...transactionData } = createTransactionDto;
    const tx = await this.postgresProvider.transaction();
    const failedGeneratedAccountUser: {
      availability_status: 'NOT_AVAILABLE' | 'COOLDOWN';
      product_variant_id: string;
      product_name: string;
    }[] = [];
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      // cek jika sudah ada transaksi agar tidak generate duplicate akun
      if (id) {
        const existingTransaction = await this.transactionRepository.findOne({
          where: { id },
          include: [{ model: TransactionItem, as: 'items' }],
          transaction: tx,
        });

        if (existingTransaction) {
          const accountUserIds = existingTransaction.dataValues.items
            .filter(item => !!item.account_user_id)
            .map(item => item.account_user_id!);

          if (!accountUserIds.length) {
            throw new NotFoundException('TRANSACTION_EXIST_NO_ACCOUNT');
          }

          const accountUsers = await this.accountUserRepository.findAll({
            where: { id: accountUserIds },
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
                ],
              },
            ],
            transaction: tx,
          });

          await tx.commit();
          return {
            transaction: existingTransaction.toJSON(),
            account_user: accountUsers.map(user => user.toJSON()),
          };
        }
      }

      const transactionId = id || this.snowflakeIdProvider.generateId();
      const transactionItems: TransactionItemCreationAttributes[] = [];
      const generatedAccountUser: AccountUserAttributes[] = [];

      for (const item of items) {
        try {
          const accountUser = await this.accountUserService.create(
            tenantId,
            {
              name: transactionData.customer,
              product_variant_id: item.product_variant_id,
              account_profile_id: item.account_profile_id,
            },
            tx,
          );

          const itemName = `${accountUser.dataValues.account.product_variant.product.name} ${accountUser.dataValues.account.product_variant.name}`;

          transactionItems.push({
            name: itemName,
            transaction_id: transactionId,
            account_user_id: accountUser.id,
          });

          generatedAccountUser.push(accountUser.toJSON());
        }
        catch (error) {
          if ((error as Error).message === 'COOLDOWN') {
            failedGeneratedAccountUser.push({
              availability_status: 'COOLDOWN',
              product_variant_id: String(item.product_variant_id),
              product_name: '-',
            });
          }
          else {
            failedGeneratedAccountUser.push({
              availability_status: 'NOT_AVAILABLE',
              product_variant_id: String(item.product_variant_id),
              product_name: '-',
            });
          }
        }
      }

      if (failedGeneratedAccountUser.length) {
        const productVariantIds = failedGeneratedAccountUser.map(
          item => item.product_variant_id,
        );
        const productVariants = await this.productVariantRepository.findAll({
          where: { id: productVariantIds },
          attributes: ['id', 'name'],
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name'] },
          ],
          transaction: tx,
        });
        if (productVariants.length) {
          for (const pv of productVariants) {
            for (let i = 0; i < failedGeneratedAccountUser.length; i++) {
              if (
                failedGeneratedAccountUser[i].product_variant_id
                === String(pv.id)
              ) {
                failedGeneratedAccountUser[i].product_name
                  = `${pv.dataValues.product.name} ${pv.dataValues.name}`;
              }
            }
          }
        }
      }

      if (!transactionItems.length) {
        throw new NotFoundException('tidak ada item transaksi yang dibuat');
      }

      await this.transactionRepository.create(
        { id: transactionId, ...transactionData },
        {
          transaction: tx,
        },
      );

      await this.transactionItemRepository.bulkCreate(transactionItems, {
        transaction: tx,
      });

      const newTransaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
        include: [{ model: TransactionItem, as: 'items' }],
        transaction: tx,
      });

      if (!newTransaction) {
        throw new NotFoundException(
          `transaction dengan id: ${transactionId} tidak ditemukan`,
        );
      }

      await tx.commit();
      return {
        transaction: newTransaction.toJSON(),
        account_user: [...generatedAccountUser, ...failedGeneratedAccountUser],
      };
    }
    catch (error) {
      await tx.rollback();
      if (failedGeneratedAccountUser.length) {
        return {
          account_user: failedGeneratedAccountUser,
        };
      }
      else {
        throw error;
      }
    }
  }

  async update(
    tenantId: string,
    transactionId: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
        transaction: tx,
      });

      if (!transaction) {
        throw new NotFoundException(
          `transaction dengan id: ${transactionId} tidak ditemukan`,
        );
      }

      await transaction.update(
        { ...updateTransactionDto },
        { transaction: tx },
      );
      await tx.commit();
      return transaction;
    }
    catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, transactionId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
        transaction: tx,
      });

      if (!transaction) {
        throw new NotFoundException(
          `transaction dengan id: ${transactionId} tidak ditemukan`,
        );
      }

      await transaction.destroy({ transaction: tx });
      await tx.commit();
    }
    catch (error) {
      await tx.rollback();
      throw error;
    }
  }
}
