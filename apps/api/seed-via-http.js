require('dotenv').config();
const { Client } = require('pg');
const http = require('http');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to DB to fetch tenants...');
  
  const res = await client.query("SELECT id FROM master.tenant WHERE status = 'active'");
  const tenants = res.rows.map(r => r.id);
  console.log(`Found ${tenants.length} tenants:`, tenants);
  await client.end();
  
  for (const tenant of tenants) {
    console.log(`Calling seeder for tenant: ${tenant}`);
    await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 4000,
        path: '/accounting/seed-netflix-coa',
        method: 'POST',
        headers: {
          'x-tenant-id': tenant,
        }
      }, (res) => {
        console.log(`Tenant ${tenant} response status: ${res.statusCode}`);
        res.on('data', d => process.stdout.write(d));
        res.on('end', () => { console.log(); resolve(); });
      });
      req.on('error', (e) => {
        console.error(`Error on tenant ${tenant}: ${e.message}`);
        resolve();
      });
      req.end();
    });
  }
}

run();
