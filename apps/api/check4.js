const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital' });
client.connect().then(() => {
  client.query("SELECT trigger_name, event_manipulation, event_object_table, action_statement FROM information_schema.triggers WHERE event_object_table = 'account_user'").then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  });
});
