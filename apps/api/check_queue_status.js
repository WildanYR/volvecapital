require('dotenv').config();
const { Sequelize } = require('sequelize');
const Redis = require('ioredis');

async function check() {
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

  // Jika ada argumen (email), cari task spesifik untuk akun itu
  const searchEmail = process.argv[2];
  if (searchEmail) {
    console.log(`\n🔎 Mencari task untuk akun: ${searchEmail}`);
    const [rows] = await sequelize.query(`
      SELECT id, subject_id, context, status, execute_at, error_message, payload
      FROM master.task_queue
      WHERE payload::text ILIKE :email
      ORDER BY execute_at ASC
    `, { replacements: { email: `%${searchEmail}%` } });

    if (rows.length === 0) {
      console.log(`❌ TIDAK ADA task ditemukan untuk email: ${searchEmail}`);
      console.log(`   Kemungkinan: task belum dibuat, atau sudah COMPLETED/FAILED`);
    } else {
      console.log(`✅ Ditemukan ${rows.length} task:\n`);
      rows.forEach((r, i) => {
        const execTime = new Date(r.execute_at);
        const now = new Date();
        const wibTime = execTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const flag = execTime <= now ? "🔴 SUDAH LEWAT" : "🟡 BELUM WAKTUNYA";
        console.log(`  ${i+1}. Context: ${r.context}`);
        console.log(`     Status: ${r.status}`);
        console.log(`     Jadwal: ${wibTime} WIB -> ${flag}`);
        if (r.error_message) console.log(`     Error: ${r.error_message}`);
        console.log(``);
      });
    }

    process.exit(0);
  }

  try {
    const now = new Date();
    console.log(`\n🕒 Waktu Sekarang (Server): ${now.toLocaleString()}`);

    // 1. Cek berapa task yang antre di DB
    const [tasks] = await sequelize.query(`
      SELECT id, subject_id, context, status, execute_at 
      FROM master.task_queue 
      WHERE status IN ('QUEUED', 'DISPATCHED') 
      ORDER BY execute_at ASC
    `);

    console.log(`\n📋 TOTAL TASK ANTRIAN (DB): ${tasks.length}`);
    
    let missedTasks = 0;
    let futureTasks = 0;

    tasks.forEach(task => {
      const execTime = new Date(task.execute_at);
      if (execTime <= now) {
        missedTasks++;
      } else {
        futureTasks++;
      }
    });

    console.log(`⚠️ Task yang SUDAH LEWAT WAKTU tapi belum tereksekusi: ${missedTasks}`);
    console.log(`⏳ Task yang JADWALNYA MASIH DI MASA DEPAN: ${futureTasks}`);

    if (tasks.length > 0) {
      console.log("\n🔍 5 Task Paling Awal (Terdekat/Terlewat):");
      tasks.slice(0, 5).forEach((t, i) => {
        const execTime = new Date(t.execute_at);
        const status = execTime <= now ? "🔴 HARUSNYA JALAN" : "🟡 BELUM WAKTUNYA";
        console.log(`  ${i+1}. ID: ${t.id.slice(0,8)}... | Status: ${t.status} | Jadwal: ${execTime.toLocaleString()} -> ${status}`);
      });
    }

    // 2. Cek di Redis ZSET
    const redisTasks = await redisClient.zrangebyscore('scheduler:task_zset', 0, now.getTime());
    console.log(`\n🚀 TASK DI REDIS YANG SIAP JALAN (<= Waktu Sekarang): ${redisTasks.length}`);
    
    const allRedisTasks = await redisClient.zrange('scheduler:task_zset', 0, -1);
    console.log(`📊 TOTAL SEMUA TASK DI REDIS (Termasuk Masa Depan): ${allRedisTasks.length}`);

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    process.exit(0);
  }
}

check();
