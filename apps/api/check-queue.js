const { Client } = require('pg');
const client = new Client('postgres://postgres:123456@localhost:5432/volvecapital');
async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM \"master\".\"task_queue\" WHERE payload LIKE '%MNL-LGOYZVRT%'");
  console.log("Tasks found:", res.rows.length);
  process.exit(0);
}
run().catch(console.error);
