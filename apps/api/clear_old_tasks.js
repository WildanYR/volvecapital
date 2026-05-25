require('dotenv').config();
const { Sequelize } = require('sequelize');
const Redis = require('ioredis');

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env!");
    process.exit(1);
  }

  const sequelize = new Sequelize(dbUrl, {
    logging: false
  });
  const redisClient = new Redis();
  
  try {
    // Cari task yang execute_at nya sudah lewat dari 2 jam lalu
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const [expiredTasks] = await sequelize.query(`
      SELECT id FROM master.task_queue 
      WHERE status IN ('QUEUED', 'DISPATCHED') 
      AND execute_at < :twoHoursAgo
    `, {
      replacements: { twoHoursAgo }
    });

    if (expiredTasks.length === 0) {
      console.log("✅ Tidak ada task lama (> 2 jam) yang perlu dihapus.");
      process.exit(0);
    }

    const taskQueueIds = expiredTasks.map(t => t.id);
    
    // 1. Hapus dari PostgreSQL
    await sequelize.query(`
      DELETE FROM master.task_queue WHERE id IN (:taskQueueIds)
    `, {
      replacements: { taskQueueIds }
    });

    // 2. Hapus dari Redis ZSET
    const redisPipeline = redisClient.pipeline();
    for (const id of taskQueueIds) {
      redisPipeline.zrem('scheduler:task_zset', `task-reference:${id}`);
    }
    await redisPipeline.exec();

    console.log(`✅ Berhasil menghapus ${expiredTasks.length} task lama dari Database dan Redis!`);
  } catch (error) {
    console.error("❌ Gagal menghapus task:", error);
  } finally {
    process.exit(0);
  }
}

run();
