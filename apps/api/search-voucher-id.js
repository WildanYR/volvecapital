const { Client } = require('pg');
const client = new Client('postgres://postgres:123456@localhost:5432/volvecapital');
async function run() {
  await client.connect();
  const res = await client.query("SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('pg_toast', 'pg_catalog', 'information_schema') AND nspname NOT LIKE 'pg_temp_%' AND nspname NOT LIKE 'pg_toast_temp_%'");
  const schemas = res.rows.map(r => r.nspname);
  for (const s of schemas) {
    try {
      const res = await client.query(`SELECT id, buyer_whatsapp, created_at, status FROM "${s}"."voucher" WHERE id = 'MNL-8DX2T8G9'`);
      if (res.rows.length > 0) {
        console.log(`\n=== Found in ${s} ===`);
        console.table(res.rows);
      }
    } catch(e) {}
  }
  process.exit(0);
}
run().catch(console.error);
