const { Client } = require('pg');
const client = new Client('postgres://postgres:123456@localhost:5432/volvecapital');
client.connect().then(() => 
  client.query("SELECT id, created_at, status FROM \"public\".\"voucher\" ORDER BY created_at DESC LIMIT 5")
).then(res => { 
  console.table(res.rows); 
  process.exit(0);
}).catch(console.error);
