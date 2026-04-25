import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { Op, WhereOptions } from 'sequelize';
import { TASK_QUEUE_REPOSITORY } from 'src/constants/database.const';
import { REDIS_CLIENT } from 'src/constants/provider.const';
import { TASK_REFERENCE_KEY, ZSET_KEY } from 'src/constants/scheduler.const';
import { TaskQueue } from 'src/database/models/task-queue.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { SnowflakeIdProvider } from '../utility/snowflake-id.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { UpsertTaskQueueDto } from './dto/upsert-task-queue.dto';
import { ITaskQueueGetFilter } from './filter/task-queue-get.filter';

@Injectable()
export class TaskQueueService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly snowflakeIdProvider: SnowflakeIdProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @Inject(TASK_QUEUE_REPOSITORY)
    private readonly taskQueueRepository: typeof TaskQueue,
  ) {}

  async findAll(pagination?: BaseGetAllUrlQuery, filter?: ITaskQueueGetFilter) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.id) {
        whereOptions.id = filter.id;
      }
      if (filter?.type) {
        whereOptions.type = filter.type;
      }
      if (filter?.status) {
        whereOptions.status = filter.status;
      }
      if (filter?.tenant_id) {
        whereOptions.tenant_id = filter.tenant_id;
      }

      const taskQueues = await this.taskQueueRepository.findAndCountAll({
        where: whereOptions,
        order,
        limit,
        offset,
        transaction,
      });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        taskQueues.rows,
        taskQueues.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(taskQueueId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const taskQueue = await this.taskQueueRepository.findOne({
        where: { id: taskQueueId },
        transaction,
      });

      if (!taskQueue) {
        throw new NotFoundException(
          `taskQueue dengan id: ${taskQueueId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return taskQueue;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async upsert(upsertTaskQueueDto: UpsertTaskQueueDto[]) {
    const redisPipeline = this.redisClient.pipeline();
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      for (const data of upsertTaskQueueDto) {
        let taskQueue = await this.taskQueueRepository.findOne({
          where: {
            tenant_id: data.tenant_id,
            subject_id: data.subject_id,
            context: data.context,
            status: { [Op.notIn]: ['COMPLETED', 'FAILED'] },
          },
          transaction,
        });

        if (taskQueue) {
          await taskQueue.update(data, { transaction });
        }
        else {
          const id = this.snowflakeIdProvider.generateId();
          taskQueue = await this.taskQueueRepository.create(
            {
              id,
              attempt: 0,
              ...data,
            },
            { transaction },
          );
        }

        const executeAt = new Date(taskQueue.dataValues.execute_at).getTime();
        redisPipeline.zadd(
          ZSET_KEY,
          executeAt,
          `${TASK_REFERENCE_KEY}:${taskQueue.id}`,
        );
      }

      await redisPipeline.exec();
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(taskQueueId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const taskQueue = await this.taskQueueRepository.findOne({
        where: { id: taskQueueId },
        transaction,
      });

      if (!taskQueue) {
        throw new NotFoundException(
          `taskQueue dengan id: ${taskQueueId} tidak ditemukan`,
        );
      }

      await taskQueue.destroy({ transaction });
      await this.redisClient.zrem(
        ZSET_KEY,
        `${TASK_REFERENCE_KEY}:${taskQueue.id}`,
      );
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async removeByAccount(
    tenantId: string,
    accountId: string,
    contexts: string[],
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const taskQueue = await this.taskQueueRepository.findAll({
        where: {
          tenant_id: tenantId,
          subject_id: accountId,
          context: contexts,
        },
        transaction,
      });

      if (taskQueue.length) {
        const taskQueueIds = taskQueue.map(t => t.id);
        await this.taskQueueRepository.destroy({
          where: { id: taskQueueIds },
          transaction,
        });

        const redisPipeline = this.redisClient.pipeline();
        for (const id of taskQueueIds) {
          redisPipeline.zrem(ZSET_KEY, `${TASK_REFERENCE_KEY}:${id}`);
        }
        await redisPipeline.exec();
      }

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
