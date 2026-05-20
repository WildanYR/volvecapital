const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital',
  });
  
  try {
    await client.connect();
    
    // 1. Query all schemas
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema') 
      ORDER BY schema_name;
    `);
    console.log('=== SCHEMAS IN DATABASE ===');
    console.log(schemasRes.rows.map(r => r.schema_name));
    
    // 2. Query all tenants from master.tenant
    const tenantsRes = await client.query(`
      SELECT * FROM "master"."tenant" ORDER BY id;
    `);
    console.log('\n=== TENANTS IN master.tenant ===');
    console.table(tenantsRes.rows);
    
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    await client.end();
  }
}

run();
