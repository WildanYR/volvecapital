const { Client } = require('pg');

const DATABASE_URL = 'postgres://postgres:123456@localhost:5432/volvecapital';
const TENANT_SCHEMAS = ['papapremium', 'paytronik'];

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('Connected to DB');

  try {
    for (const schema of TENANT_SCHEMAS) {
      console.log(`Updating schema: ${schema}...`);
      await client.query(`ALTER TABLE ${schema}.email_message ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);`);
    }

    console.log('Migration SUCCESS');
  } catch (err) {
    console.error('Migration FAILED', err);
  } finally {
    await client.end();
  }
}

run();
