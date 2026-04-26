const { Client } = require('pg');

const DATABASE_URL = 'postgres://postgres:123456@localhost:5432/volvecapital';
const TENANT_SCHEMAS = ['papapremium', 'paytronik'];

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('Connected to DB');

  try {
    // 1. master.email_subject
    console.log('Updating master.email_subject...');
    await client.query('ALTER TABLE master.email_subject ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;');

    // 2. tenant schemas
    for (const schema of TENANT_SCHEMAS) {
      console.log(`Updating schema: ${schema}...`);
      await client.query(`ALTER TABLE ${schema}.voucher ADD COLUMN IF NOT EXISTS access_token VARCHAR(255) UNIQUE;`);
      await client.query(`ALTER TABLE ${schema}.voucher ADD COLUMN IF NOT EXISTS access_count_today INTEGER NOT NULL DEFAULT 0;`);
      await client.query(`ALTER TABLE ${schema}.voucher ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMP;`);
    }

    console.log('Migration SUCCESS');
  } catch (err) {
    console.error('Migration FAILED', err);
  } finally {
    await client.end();
  }
}

run();
