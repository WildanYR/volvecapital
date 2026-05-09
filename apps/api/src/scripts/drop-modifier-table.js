const { Sequelize, QueryTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from apps/api/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
});

async function run() {
  console.log('Fetching all tenants...');
  const tenants = await sequelize.query(
    'SELECT id FROM master.tenant WHERE status = \'active\'',
    { type: QueryTypes.SELECT }
  );

  console.log(`Found ${tenants.length} tenants. Dropping account_modifier table...`);

  for (const tenant of tenants) {
    const schema = tenant.id;
    console.log(`Processing schema: ${schema}...`);
    try {
      await sequelize.query(`DROP TABLE IF EXISTS "${schema}"."account_modifier" CASCADE`);
      // Also remove from migration metadata to prevent issues if we ever re-create it
      await sequelize.query(`DELETE FROM "${schema}"."SequelizeMeta_${schema}" WHERE name = '008-create-account-modifier-table.ts'`).catch(() => {});
      console.log(`Successfully dropped table in schema: ${schema}`);
    } catch (error) {
      console.error(`Failed to drop table in schema: ${schema}`, error.message);
    }
  }

  console.log('Done.');
  await sequelize.close();
}

run();
