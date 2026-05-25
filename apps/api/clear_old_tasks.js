require('dotenv').config();
const { Sequelize } = require('sequelize');
const Redis = require('ioredis');

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env!");
    process.exit(1);
  }

  const sequelize = new Sequelize(dbUrl, { logging: false });
  const redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  });
  
  try {
    // Cari task yatim (orphan) di Redis yang sudah tidak ada di DB
    const allRedisTasks = await redisClient.zrange('scheduler:task_zset', 0, -1);
    const orphanTasks = [];
    
    for (const redisKey of allRedisTasks) {
      const taskId = redisKey.split(':')[1];
      if (taskId) {
        const [[task]] = await sequelize.query(`SELECT id FROM master.task_queue WHERE id = :taskId`, {
          replacements: { taskId }
        });
        if (!task) {
          orphanTasks.push(redisKey);
        }
      }
    }

    if (orphanTasks.length > 0) {
      const redisPipeline = redisClient.pipeline();
      for (const key of orphanTasks) {
        redisPipeline.zrem('scheduler:task_zset', key);
      }
      await redisPipeline.exec();
      console.log(`✅ Berhasil membersihkan ${orphanTasks.length} task "hantu" dari Redis (task yang sudah terhapus di DB)!`);
    }

    // Cari task yang execute_at nya sudah lewat dari 2 jam lalu (kalau masih ada di DB)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const [expiredTasks] = await sequelize.query(`
      SELECT id FROM master.task_queue 
      WHERE status IN ('QUEUED', 'DISPATCHED') 
      AND execute_at < :twoHoursAgo
    `, {
      replacements: { twoHoursAgo }
    });

    if (expiredTasks.length > 0) {
      const taskQueueIds = expiredTasks.map(t => t.id);
      await sequelize.query(`DELETE FROM master.task_queue WHERE id IN (:taskQueueIds)`, {
        replacements: { taskQueueIds }
      });

      const redisPipeline = redisClient.pipeline();
      for (const id of taskQueueIds) {
        redisPipeline.zrem('scheduler:task_zset', `task-reference:${id}`);
      }
      await redisPipeline.exec();
      console.log(`✅ Berhasil menghapus tambahan ${expiredTasks.length} task lama dari Database dan Redis!`);
    }

    if (orphanTasks.length === 0 && expiredTasks.length === 0) {
      console.log("✅ Tidak ada task lama (> 2 jam) atau task hantu yang perlu dihapus. Semuanya sudah bersih!");
    }

  } catch (error) {
    console.error("❌ Gagal membersihkan task:", error);
  } finally {
    process.exit(0);
  }
}

run();
