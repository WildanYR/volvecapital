const { Client } = require('pg');
const Redis = require('ioredis');

// Ambil email dari argument --email
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith('--email='));
const emailInput = emailArg ? emailArg.split('=')[1] : args[args.indexOf('--email') + 1];

if (!emailInput) {
    console.error('❌ Mohon masukkan email. Contoh: node reset_now.js --email user@gmail.com');
    process.exit(1);
}

async function run() {
    const pg = new Client({ connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital' });
    const redis = new Redis({ host: '127.0.0.1', port: 6379 });
    
    try {
        await pg.connect();
        console.log(`🔍 Mencari akun: ${emailInput}...`);

        // 1. Dapatkan daftar tenant
        const tenantRes = await pg.query('SELECT id FROM master.tenant');
        const tenants = tenantRes.rows.map(r => r.id);

        let targetAccount = null;

        // 2. Cari email di setiap schema tenant
        for (const tenant of tenants) {
            try {
                const res = await pg.query(`
                    SELECT a.id, a.account_password, e.email 
                    FROM ${tenant}.account a 
                    JOIN ${tenant}.email e ON e.id = a.email_id 
                    WHERE e.email = $1
                `, [emailInput]);

                if (res.rows.length > 0) {
                    targetAccount = {
                        tenant,
                        id: res.rows[0].id,
                        email: res.rows[0].email,
                        password: res.rows[0].account_password
                    };
                    break;
                }
            } catch (e) { /* skip schema errors */ }
        }

        if (!targetAccount) {
            console.error(`❌ Akun dengan email ${emailInput} tidak ditemukan di tenant manapun.`);
            return;
        }

        console.log(`✅ Ditemukan! Tenant: ${targetAccount.tenant}, ID: ${targetAccount.id}`);

        // 3. Siapkan waktu eksekusi (10 detik lagi)
        const executeAt = new Date();
        executeAt.setSeconds(executeAt.getSeconds() + 10);
        const randomSuffix = Math.floor(Math.random() * 1000);
        const newPassword = `VolveReset${randomSuffix}!`; // Password lebih kuat (Besar, Kecil, Angka, Simbol)

        // 4. Update Database
        await pg.query(`UPDATE ${targetAccount.tenant}.account SET batch_end_date = $1 WHERE id = $2`, [executeAt, targetAccount.id]);

        const taskId = Date.now().toString();
        const payload = JSON.stringify({
            accountId: targetAccount.id,
            email: targetAccount.email,
            password: targetAccount.password,
            newPassword: newPassword
        });

        await pg.query(`
            INSERT INTO master.task_queue (id, context, execute_at, subject_id, payload, status, tenant_id, attempt, created_at, updated_at)
            VALUES ($1, 'NETFLIX_RESET_PASSWORD', $2, $3, $4, 'QUEUED', $5, 0, NOW(), NOW())
        `, [taskId, executeAt, targetAccount.id, payload, targetAccount.tenant]);

        // 5. Update Redis
        const score = executeAt.getTime();
        await redis.zadd('vcscheduler:delayed_jobs', score, `task:${taskId}`);

        console.log(`🚀 RESET DIJADWALKAN!`);
        console.log(`   Waktu: ${executeAt.toLocaleTimeString()}`);
        console.log(`   Password Baru: ${newPassword}`);
        console.log(`\nSilahkan pantau terminal Bot sekarang.`);

    } catch (e) {
        console.error('❌ Terjadi kesalahan:', e.message);
    } finally {
        await pg.end();
        await redis.quit();
    }
}

run();
