import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import {
  ACCOUNT_USER_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  TRANSACTION_ITEM_TS_REPOSITORY,
  TRANSACTION_TS_REPOSITORY,
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
import { TransactionItemTS, TransactionItemTSCreationAttributes } from 'src/database/models/transaction-item-ts.model';
import { TransactionTS, TransactionTSAttributes } from 'src/database/models/transaction-ts.model';
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
    @Inject(ACCOUNT_USER_REPOSITORY)
    private readonly accountUserRepository: typeof AccountUser,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
    @Inject(TRANSACTION_TS_REPOSITORY)
    private readonly transactionTSRepository: typeof TransactionTS,
    @Inject(TRANSACTION_ITEM_TS_REPOSITORY)
    private readonly transactionItemTSRepository: typeof TransactionItemTS,
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

      const transactions = await this.transactionTSRepository.findAndCountAll({
        where: whereOptions,
        order: !pagination?.order_by ? [['created_at', 'DESC']] : order,
        limit,
        offset,
        distinct: true,
        include: [
          {
            model: TransactionItemTS,
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

      const transaction = await this.transactionTSRepository.findOne({
        where: { id: transactionId },
        include: [
          {
            model: TransactionItemTS,
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
    transaction?: TransactionTSAttributes;
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
        const existingTransaction = await this.transactionTSRepository.findOne({
          where: { id },
          include: [{ model: TransactionItemTS, as: 'items' }],
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
      const transactionTSItems: TransactionItemTSCreationAttributes[] = [];
      const generatedAccountUser: AccountUserAttributes[] = [];

      for (const item of items) {
        try {
          const accountUser = await this.accountUserService.create(
            tenantId,
            {
              name: transactionData.customer,
              product_variant_id: item.product_variant_id,
              price: item.price,
              account_profile_id: item.account_profile_id,
            },
            tx,
          );

          const itemPrice = item.price ? String(item.price) : String(accountUser.dataValues.account.product_variant.base_price);

          transactionTSItems.push({
            price: itemPrice as any,
            account_id: accountUser.dataValues.account_id,
            product_id: accountUser.dataValues.account.product_variant.product_id,
            product_variant_id: accountUser.dataValues.account.product_variant_id,
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

      if (!transactionTSItems.length) {
        throw new NotFoundException('tidak ada item transaksi yang dibuat');
      }

      const total_price = transactionTSItems.reduce((v, c) => v + Number.parseInt(c.price), 0);
      await this.transactionTSRepository.create({ id: transactionId, ...transactionData, total_price }, { transaction: tx });

      await this.transactionItemTSRepository.bulkCreate(transactionTSItems, { transaction: tx });

      const newTransaction = await this.transactionTSRepository.findOne({
        where: { id: transactionId },
        include: [{ model: TransactionItemTS, as: 'items' }],
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

      const transaction = await this.transactionTSRepository.findOne({
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

      const transaction = await this.transactionTSRepository.findOne({
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
