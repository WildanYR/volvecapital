import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as pg from 'pg';
import { QueryOptions, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TaskQueue } from './models/task-queue.model';
import { Tenant } from './models/tenant.model';

@Injectable()
export class PostgresProvider {
  private sequelize?: Sequelize;

  constructor(private configService: ConfigService) {
    if (!this.sequelize) {
      const databaseUrl = this.configService.get<string>('database.url');
      const poolMin = this.configService.get<number>('database.pool.min');
      const poolMax = this.configService.get<number>('database.pool.max');
      const poolAcquire = this.configService.get<number>('database.pool.acquire');
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

      this.sequelize.addModels([Tenant, TaskQueue]);
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
