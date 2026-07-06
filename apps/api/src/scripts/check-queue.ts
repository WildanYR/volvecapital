import type Redis from 'ioredis';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { REDIS_CLIENT } from '../constants/provider.const';
import { TaskQueue } from '../database/models/task-queue.model';
import { PostgresProvider } from '../database/postgres.provider';
import { Sequelize } from 'sequelize-typescript';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  console.log('📊 Memeriksa status antrean Task Queue...');

  try {
    // 1. Cek Redis ZSET & Stream
    const redis = app.get<Redis>(REDIS_CLIENT);
    const zsetSize = await redis.zcard('scheduler:zset');
    const streamSize = await redis.xlen('scheduler:stream');
    
    console.log('\n--- Status Redis ---');
    console.log(`🔹 scheduler:zset   : ${zsetSize} task dijadwalkan`);
    console.log(`🔹 scheduler:stream : ${streamSize} task sedang/siap diproses`);

    // 2. Cek Database (Group By Status)
    const postgresProvider = app.get(PostgresProvider);
    const transaction = await postgresProvider.transaction();
    
    try {
      await postgresProvider.setSchema('master', transaction);
      
      const stats = await TaskQueue.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true,
        transaction
      }) as any[];

      await transaction.commit();

      console.log('\n--- Status Database (task_queue) ---');
      if (stats.length === 0) {
        console.log('✅ Tidak ada data task di database.');
      } else {
        stats.forEach(row => {
          let emoji = '⚪';
          if (row.status === 'COMPLETED') emoji = '✅';
          if (row.status === 'FAILED') emoji = '❌';
          if (row.status === 'QUEUED') emoji = '⏳';
          if (row.status === 'DISPATCHED') emoji = '🚀';
          console.log(`${emoji} ${row.status.padEnd(12)} : ${row.count} task`);
        });
      }
    } catch (dbError) {
      await transaction.rollback();
      throw dbError;
    }
  } catch (error) {
    console.error('❌ Gagal memeriksa status queue:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
