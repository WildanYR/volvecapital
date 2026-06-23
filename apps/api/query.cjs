const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital' });
client.connect().then(() => {
  client.query("SELECT content FROM manual_book WHERE title = 'test' ORDER BY created_at DESC LIMIT 1").then(res => {
    console.log(res.rows[0].content);
    client.end();
  });
});
