import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as pg from 'pg';
import { QueryOptions, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ARTICLE_REPOSITORY, EMAIL_MESSAGE_REPOSITORY, EMAIL_REPOSITORY, EMAIL_SUBJECT_REPOSITORY, PEAK_HOUR_STATISTICS_REPOSITORY, PLATFORM_PRODUCT_REPOSITORY, PLATFORM_STATISTICS_REPOSITORY, PRODUCT_REPOSITORY, PRODUCT_SALES_STATISTICS_REPOSITORY, PRODUCT_VARIANT_REPOSITORY, REVENUE_STATISTICS_REPOSITORY, SYSLOG_REPOSITORY, TASK_QUEUE_REPOSITORY, TENANT_REPOSITORY, TRANSACTION_ITEM_REPOSITORY, TRANSACTION_REPOSITORY, VOUCHER_REPOSITORY, ACCOUNT_REPOSITORY, ACCOUNT_MODIFIER_REPOSITORY, ACCOUNT_PROFILE_REPOSITORY, ACCOUNT_USER_REPOSITORY, TENANT_SETTING_REPOSITORY, TENANT_OWNER_REPOSITORY, TUTORIAL_REPOSITORY } from 'src/constants/database.const';
import { AccountModifier } from './models/account-modifier.model';
import { EmailMessage } from './models/email-message.model';
import { AccountProfile } from './models/account-profile.model';
import { AccountUser } from './models/account-user.model';
import { Account } from './models/account.model';
import { EmailSubject } from './models/email-subject.model';
import { Email } from './models/email.model';
import { PeakHourStatistics } from './models/peak-hour-statistics.model';
import { PlatformProduct } from './models/platform-product.model';
import { PlatformStatistics } from './models/platform-statistics.model';
import { ProductSalesStatistics } from './models/product-sales-statistics.model';
import { ProductVariant } from './models/product-variant.model';
import { Product } from './models/product.model';
import { RevenueStatistics } from './models/revenue-statistics.model';
import { Syslog } from './models/syslog.model';
import { TaskQueue } from './models/task-queue.model';
import { Tenant } from './models/tenant.model';
import { TransactionItem } from './models/transaction-item.model';
import { Transaction as TransactionModel } from './models/transaction.model';
import { Voucher } from './models/voucher.model';
import { TenantSetting } from './models/tenant-setting.model';
import { Tutorial } from './models/tutorial.model';
import { Article } from './models/article.model';
import { AccountCapital } from './models/account-capital.model';
import { TenantOwner } from './models/tenant-owner.model';

@Injectable()
export class PostgresProvider {
  private sequelize?: Sequelize;

  constructor(private configService: ConfigService) {
    if (!this.sequelize) {
      const databaseUrl = this.configService.get<string>('database.url');
      const poolMin = this.configService.get<number>('database.pool.min');
      const poolMax = this.configService.get<number>('database.pool.max');
      const poolAcquire = this.configService.get<number>(
        'database.pool.acquire',
      );
      const poolIdle = this.configService.get<number>('database.pool.idle');
      const poolEvict = this.configService.get<number>('database.pool.evict');
      this.sequelize = new Sequelize(databaseUrl!, {
        dialect: 'postgres',
        dialectModule: pg,
        define: {
          freezeTableName: true,
          timestamps: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
        pool: {
          min: poolMin,
          max: poolMax,
          acquire: poolAcquire,
          idle: poolIdle,
          evict: poolEvict,
        },
        logging: false,
      });
      this.sequelize.addModels([
        Tenant,
        TaskQueue,
        Email,
        Product,
        ProductVariant,
        PlatformProduct,
        Account,
        AccountModifier,
        AccountProfile,
        AccountUser,
        TransactionModel,
        TransactionItem,
        RevenueStatistics,
        ProductSalesStatistics,
        PeakHourStatistics,
        PlatformStatistics,
        EmailSubject,
        EmailMessage,
        Syslog,
        Voucher,
        TenantSetting,
        Tutorial,
        Article,
        AccountCapital,
        TenantOwner,
      ]);
    }
    else {
      this.sequelize.connectionManager.initPools();

      const connectionManager = (
        this.sequelize as { connectionManager?: { getConnection?: unknown } }
      ).connectionManager;

      if (
        connectionManager
        && typeof connectionManager.getConnection === 'function'
      ) {
        connectionManager.getConnection = undefined;
      }
    }
  }

  async transaction(): Promise<Transaction> {
    if (!this.sequelize) {
      throw new Error('database connection not estabilished');
    }
    return await this.sequelize.transaction();
  }

  async rawQuery(sql: string, options: QueryOptions) {
    if (!this.sequelize) {
      throw new Error('database connection not estabilished');
    }
    return await this.sequelize.query(sql, options);
  }

  async setSchema(schema: string, transaction: Transaction): Promise<void> {
    if (!this.sequelize) {
      throw new Error('database connection not estabilished');
    }
    if (!/^[\w-]+$/.test(schema)) {
      throw new Error('invalid schema name');
    }
    await this.sequelize.query(`SET search_path TO "${schema}"`, {
      transaction,
    });
  }
}
