const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital'
  });
  await client.connect();

  const schemasRes = await client.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'public')`);
  
  const allVariants = [];
  
  for (const row of schemasRes.rows) {
    const schema = row.schema_name;
    try {
      const res = await client.query(`
        SELECT p.name as product_name, pv.name as variant_name
        FROM "${schema}".product_variant pv
        JOIN "${schema}".product p ON p.id = pv.product_id
      `);
      for (const v of res.rows) {
        allVariants.push({
          tenant: schema,
          product: v.product_name,
          variant: v.variant_name
        });
      }
    } catch (e) {
      console.error(`Error in schema ${schema}:`, e.message);
    }
  }

  console.log(JSON.stringify(allVariants, null, 2));
  await client.end();
}

run().catch(console.error);
