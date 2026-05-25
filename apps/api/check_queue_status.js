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

    const [allTasks] = await sequelize.query(`
      SELECT COUNT(*) as total FROM master.task_queue 
      WHERE status IN ('QUEUED', 'DISPATCHED')
    `);
    const totalQueued = parseInt(allTasks[0].total || 0, 10);

    const [pastDueTasks] = await sequelize.query(`
      SELECT COUNT(*) as total FROM master.task_queue 
      WHERE status IN ('QUEUED', 'DISPATCHED') 
      AND execute_at <= NOW()
    `);
    const totalPastDue = parseInt(pastDueTasks[0].total || 0, 10);
    const totalFuture = totalQueued - totalPastDue;

    console.log(`\n📋 TOTAL TASK ANTRIAN (DB): ${totalQueued}`);
    if (totalPastDue > 0) {
      console.log(`⚠️ Task yang SUDAH LEWAT WAKTU tapi belum tereksekusi: ${totalPastDue}`);
    }
    console.log(`⏳ Task yang JADWALNYA MASIH DI MASA DEPAN: ${totalFuture}`);

    const [topTasks] = await sequelize.query(`
      SELECT id, subject_id, context, status, execute_at, payload 
      FROM master.task_queue 
      WHERE status IN ('QUEUED', 'DISPATCHED') 
      ORDER BY execute_at ASC 
      LIMIT 5
    `);

    console.log(`\n🔍 5 Task Paling Awal (Terdekat/Terlewat):`);
    topTasks.forEach((t, i) => {
      const execTime = new Date(t.execute_at);
      const isPast = execTime <= now;
      const wibTime = execTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      
      let email = 'Tanpa Email';
      try {
        if (t.payload) {
          const parsed = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload;
          if (parsed.email) email = parsed.email;
        }
      } catch(e) {}

      console.log(`  ${i+1}. [${email}] Context: ${t.context} | Status: ${t.status} | Jadwal: ${wibTime} WIB -> ${isPast ? '🔴 HARUSNYA JALAN' : '🟡 BELUM WAKTUNYA'}`);
    });

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
