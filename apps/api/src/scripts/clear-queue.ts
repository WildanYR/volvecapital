import type Redis from 'ioredis';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { REDIS_CLIENT } from '../constants/provider.const';
import { TaskQueue } from '../database/models/task-queue.model';
import { PostgresProvider } from '../database/postgres.provider';
import 'reflect-metadata';

async function bootstrap() {
  // Gunakan suppress error logger agar tidak berisik saat init
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  console.log('🚀 Memulai proses cuci gudang task queue...');

  try {
    // 1. Bersihkan Redis
    const redis = app.get<Redis>(REDIS_CLIENT);
    await redis.del('scheduler:zset', 'scheduler:stream');
    console.log('✅ Redis ZSET & Stream berhasil dihapus.');

    // 2. Bersihkan Database
    const postgresProvider = app.get(PostgresProvider);
    const transaction = await postgresProvider.transaction();
    try {
      await postgresProvider.setSchema('master', transaction);
      const [affectedCount] = await TaskQueue.update(
        { status: 'FAILED' },
        { where: { status: ['QUEUED', 'DISPATCHED'] }, transaction }
      );
      await transaction.commit();
      console.log(`✅ Database dibersihkan: ${affectedCount} task diubah statusnya menjadi FAILED.`);
    }
    catch (dbError) {
      await transaction.rollback();
      throw dbError;
    }
    console.log('✨ Selesai! Antrian sekarang kosong.');
  }
  catch (error) {
    console.error('❌ Gagal membersihkan queue:', error);
  }
  finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
