require('dotenv').config();
const { Sequelize, Op } = require('sequelize');
const Redis = require('ioredis');

async function sync() {
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
    // Ambil task dari 2 jam lalu hingga masa depan
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const [pendingTasks] = await sequelize.query(`
      SELECT id, execute_at FROM master.task_queue 
      WHERE status IN ('QUEUED', 'DISPATCHED') 
      AND execute_at >= :twoHoursAgo
    `, {
      replacements: { twoHoursAgo }
    });

    if (pendingTasks.length === 0) {
      console.log("✅ Tidak ada task pending di DB yang perlu di-sync.");
      process.exit(0);
    }

    const redisPipeline = redisClient.pipeline();
    let count = 0;
    
    for (const task of pendingTasks) {
      const executeAt = new Date(task.execute_at).getTime();
      redisPipeline.zadd('scheduler:task_zset', executeAt, `task-reference:${task.id}`);
      count++;
    }
    
    await redisPipeline.exec();
    console.log(`✅ Berhasil melakukan sinkronisasi! ${count} task telah dimuat ulang ke dalam memori alarm Redis.`);
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    process.exit(0);
  }
}

sync();
