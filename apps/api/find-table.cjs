const { Client } = require('pg');
const client = new Client('postgres://postgres:123456@localhost:5432/volvecapital');
async function run() {
  try {
    await client.connect();
    const res = await client.query(`SELECT content FROM "paytronik"."manual_book" WHERE slug='sop-wa'`);
    console.log(res.rows[0]?.content);
  } catch(e) {
    console.error(e);
  } finally {
    client.end();
  }
}
run();
