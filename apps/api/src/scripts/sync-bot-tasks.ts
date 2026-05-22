/**
 * STANDALONE sync script - does NOT load NestJS AppModule.
 * Directly connects to PostgreSQL and Redis to sync task queues.
 * Safe to run while the API server is running.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';
import Redis from 'ioredis';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ZSET_KEY = 'scheduler:zset';
const TASK_REF_KEY = 'task';
const NETFLIX_CONTEXT = 'NETFLIX_RESET_PASSWORD';
const SUBS_NOTIFY_CONTEXT = 'SUBS_END_NOTIFY';
const TENANT_ID = 'paytronik';

async function run() {
  console.log('🔌 Menghubungkan ke database...');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL tidak ditemukan di .env!');

  const pg = new Client({ connectionString: dbUrl });

  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  await pg.connect();
  console.log('✅ PostgreSQL & Redis terhubung.\n');

  try {
    // Ambil semua akun aktif beserta relasi yang dibutuhkan
    const { rows: accounts } = await pg.query<{
      id: string;
      batch_end_date: Date | null;
      subscription_expiry: Date | null;
      account_password: string;
      account_email: string;
      variant_name: string;
      product_name: string;
    }>(`
      SELECT
        a.id,
        a.batch_end_date,
        a.subscription_expiry,
        a.account_password,
        e.email   AS account_email,
        pv.name   AS variant_name,
        p.name    AS product_name
      FROM   ${TENANT_ID}.account a
      LEFT JOIN ${TENANT_ID}.email           e  ON e.id  = a.email_id
      LEFT JOIN ${TENANT_ID}.product_variant pv ON pv.id = a.product_variant_id
      LEFT JOIN ${TENANT_ID}.product         p  ON p.id  = pv.product_id
      WHERE  a.status NOT IN ('disable', 'banned', 'freeze')
    `);

    console.log(`📋 Ditemukan ${accounts.length} akun aktif. Menyinkronkan jadwal...\n`);

    const redisPipeline = redis.pipeline();
    let netflixCount = 0;
    let notifCount = 0;

    for (const acc of accounts) {
      const isNetflix = (acc.product_name || '').toLowerCase().includes('netflix');

      // ---- 1. NETFLIX_RESET_PASSWORD ----
      if (isNetflix && acc.batch_end_date) {
        const executeAt = new Date(acc.batch_end_date);
        const payload = JSON.stringify({
          id: acc.id,
          accountId: acc.id,
          email: acc.account_email || '',
          password: acc.account_password,
          newPassword: '',
          subscription_expiry: acc.subscription_expiry
            ? new Date(acc.subscription_expiry).toISOString()
            : '',
          variant_name: acc.variant_name || '',
        });

        const existing = await pg.query(
          `SELECT id FROM master.task_queue
           WHERE tenant_id=$1 AND subject_id=$2 AND context=$3
             AND status NOT IN ('COMPLETED','FAILED') LIMIT 1`,
          [TENANT_ID, acc.id, NETFLIX_CONTEXT],
        );

        let taskId: string;
        if (existing.rows.length > 0) {
          taskId = existing.rows[0].id;
          await pg.query(
            `UPDATE master.task_queue SET execute_at=$1, payload=$2, status='QUEUED' WHERE id=$3`,
            [executeAt, payload, taskId],
          );
        } else {
          taskId = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
          await pg.query(
            `INSERT INTO master.task_queue
               (id, tenant_id, subject_id, context, execute_at, payload, status, attempt)
             VALUES ($1,$2,$3,$4,$5,$6,'QUEUED',0)`,
            [taskId, TENANT_ID, acc.id, NETFLIX_CONTEXT, executeAt, payload],
          );
        }
        redisPipeline.zadd(ZSET_KEY, executeAt.getTime(), `${TASK_REF_KEY}:${taskId}`);
        netflixCount++;
      }

      // ---- 2. SUBS_END_NOTIFY ----
      if (acc.subscription_expiry) {
        const dday = new Date(acc.subscription_expiry);
        dday.setUTCHours(0, 0, 0, 0); // 07:00 WIB

        const notifPayload = JSON.stringify({
          context: 'NEED_ACTION',
          tenant_id: TENANT_ID,
          message: `Langganan akun ${acc.account_email} [${acc.product_name}] telah berakhir.`,
        });

        const existing = await pg.query(
          `SELECT id FROM master.task_queue
           WHERE tenant_id=$1 AND subject_id=$2 AND context=$3
             AND status NOT IN ('COMPLETED','FAILED') LIMIT 1`,
          [TENANT_ID, acc.id, SUBS_NOTIFY_CONTEXT],
        );

        let taskId: string;
        if (existing.rows.length > 0) {
          taskId = existing.rows[0].id;
          await pg.query(
            `UPDATE master.task_queue SET execute_at=$1, payload=$2, status='QUEUED' WHERE id=$3`,
            [dday, notifPayload, taskId],
          );
        } else {
          taskId = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
          await pg.query(
            `INSERT INTO master.task_queue
               (id, tenant_id, subject_id, context, execute_at, payload, status, attempt)
             VALUES ($1,$2,$3,$4,$5,$6,'QUEUED',0)`,
            [taskId, TENANT_ID, acc.id, SUBS_NOTIFY_CONTEXT, dday, notifPayload],
          );
        }
        redisPipeline.zadd(ZSET_KEY, dday.getTime(), `${TASK_REF_KEY}:${taskId}`);
        notifCount++;
      }
    }

    await redisPipeline.exec();

    console.log(`✅ SELESAI!`);
    console.log(`   Netflix reset tasks   : ${netflixCount}`);
    console.log(`   Notifikasi subs tasks : ${notifCount}`);
    console.log(`\nBot sudah siap berjalan dengan jadwal yang benar! 🚀\n`);
  } catch (err) {
    console.error('❌ Gagal sinkronisasi:', err);
  } finally {
    await pg.end();
    redis.disconnect();
    process.exit(0);
  }
}

run();
