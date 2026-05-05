import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TaskQueue } from '../database/models/task-queue.model';
import { REDIS_CLIENT } from '../constants/provider.const';
import Redis from 'ioredis';

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
    // TaskQueue di sini adalah model Sequelize-Typescript yang diimport langsung
    const [affectedCount] = await TaskQueue.update(
      { status: 'FAILED' },
      { where: { status: ['QUEUED', 'DISPATCHED'] } }
    );
    
    console.log(`✅ Database dibersihkan: ${affectedCount} task diubah statusnya menjadi FAILED.`);
    console.log('✨ Selesai! Antrian sekarang kosong.');

  } catch (error) {
    console.error('❌ Gagal membersihkan queue:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
