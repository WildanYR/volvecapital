const { Client } = require('pg');

const client = new Client({ connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital' });
client.connect().then(() => {
  client.query('SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN (\'information_schema\', \'pg_catalog\', \'pg_toast\', \'public\')').then((schemas) => {
    let promises = schemas.rows.map((s) => {
      const schema = s.schema_name;
      return client.query(`SELECT au.id, au.name, au.status, au.account_id, au.account_profile_id, e.email as email, p.name as profile_name FROM "${schema}".account_user au JOIN "${schema}".account a ON a.id = au.account_id JOIN "${schema}".account_profile p ON p.id = au.account_profile_id JOIN "${schema}".email e ON a.email_id = e.id WHERE au.name ILIKE '%adnan%'`).catch(() => null);
    });
    Promise.all(promises).then((results) => {
      results.forEach((res) => {
        if (res && res.rows.length > 0) {
          console.log(JSON.stringify(res.rows, null, 2));
        }
      });
      process.exit(0);
    }).catch((e) => { console.error(e); process.exit(1); });
  });
});
