const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgres://postgres:123456@localhost:5432/volvecapital', {
  dialect: 'postgres',
  logging: false,
});

async function run() {
  try {
    const tenants = await sequelize.query('SELECT schema_name FROM information_schema.schemata', {
      type: Sequelize.QueryTypes.SELECT,
    });

    for (const { schema_name } of tenants) {
      if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema_name) || schema_name.startsWith('pg_')) {
        continue;
      }

      console.log(`Migrating schema: ${schema_name}`);

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${schema_name}"."label" (
          "id" BIGSERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "color" VARCHAR(255),
          "product_variant_id" BIGINT NOT NULL REFERENCES "${schema_name}"."product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `);

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${schema_name}"."account_label" (
          "id" BIGSERIAL PRIMARY KEY,
          "account_id" BIGINT NOT NULL REFERENCES "${schema_name}"."account"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "label_id" BIGINT NOT NULL REFERENCES "${schema_name}"."label"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS account_label_unique_idx_${schema_name} 
        ON "${schema_name}"."account_label" ("account_id", "label_id");
      `);

      // Add to umzug tracker to prevent it from running again if we fix umzug
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${schema_name}"."SequelizeMeta_${schema_name}" (
          name VARCHAR(255) PRIMARY KEY
        );
      `);
      
      await sequelize.query(`
        INSERT INTO "${schema_name}"."SequelizeMeta_${schema_name}" (name) 
        VALUES ('048-create-label-tables.ts')
        ON CONFLICT DO NOTHING;
      `);

      console.log(`Successfully migrated ${schema_name}`);
    }

    console.log('All done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
