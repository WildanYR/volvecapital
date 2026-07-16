const { Client } = require('pg');
const client = new Client('postgres://postgres:123456@localhost:5432/volvecapital');
async function run() {
  await client.connect();
  const schemas = ['master', 'capital', 'papapremium', 'paytronik', 'rojolapak'];
  for (const s of schemas) {
    try {
      console.log(`\nSchema: ${s}`);
      const res = await client.query(`SELECT id, created_at, status FROM "${s}"."voucher" ORDER BY created_at DESC LIMIT 5`);
      console.table(res.rows);
    } catch(e) {
      console.log('Error:', e.message);
    }
  }
  process.exit(0);
}
run().catch(console.error);
