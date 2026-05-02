/* eslint-disable no-console */
import type { QueryInterface } from 'sequelize';
import * as path from 'node:path';
import { Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { CONFIG } from './config';

const sequelize = new Sequelize(CONFIG.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true,
  },
});

export interface MigrationContext {
  queryInterface: QueryInterface;
  schema: string;
}

function createUmzug(schema: string, folder: string) {
  const globPath = path.join(__dirname, folder, '*.{ts,js}').replace(/\\/g, '/');
  return new Umzug({
    migrations: { glob: globPath },
    context: {
      queryInterface: sequelize.getQueryInterface(),
      schema,
    } as MigrationContext,
    storage: new SequelizeStorage({
      sequelize,
      modelName: `SequelizeMeta_${schema}`,
      schema,
    }),
    logger: console,
  });
}

export async function migrateUp() {
  try {
    console.log('▶ Running master migrations...');
    const masterUmzug = createUmzug('master', './master');
    await masterUmzug.up();
    console.log('✅ Master migrations done');

    let schemas = CONFIG.TENANT_SCHEMAS.split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (schemas.length === 0) {
      console.log('🔍 TENANT_SCHEMAS is empty, fetching all schemas from database...');
      const [results] = await sequelize.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'master', 'pg_toast') AND schema_name NOT LIKE 'pg_temp_%' AND schema_name NOT LIKE 'pg_toast_%'"
      );
      schemas = (results as any[]).map(r => r.schema_name);
    }

    if (schemas.length === 0) {
      console.warn('⚠️ No tenant schemas found to migrate');
    }

    for (const schema of schemas) {
      console.log(`▶ Migrating tenant schema: ${schema}`);
      const umzug = createUmzug(schema, './tenant');
      await umzug.up();

      console.log(`✅ Tenant migrated: ${schema}`);
    }

    console.log('🎉 All migrations completed');
  }
  catch (err) {
    console.error(
      '❌ Migration error:',
      err instanceof Error ? err.message : err,
    );
  }
}

export async function migrateDown() {
  try {
    console.log('▶ Running master reverse migrations...');
    const masterUmzug = createUmzug('master', './master');
    await masterUmzug.down({ step: 99 });
    console.log('✅ Master reverse migrations done');

    let schemas = CONFIG.TENANT_SCHEMAS.split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (schemas.length === 0) {
      console.log('🔍 TENANT_SCHEMAS is empty, fetching all schemas from database...');
      const [results] = await sequelize.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'master', 'pg_toast') AND schema_name NOT LIKE 'pg_temp_%' AND schema_name NOT LIKE 'pg_toast_%'"
      );
      schemas = (results as any[]).map(r => r.schema_name);
    }

    if (schemas.length === 0) {
      console.warn('⚠️ No tenant schemas found to reverse migrate');
    }

    for (const schema of schemas) {
      console.log(`▶ Reverse Migrating tenant schema: ${schema}`);
      const umzug = createUmzug(schema, './tenant');
      await umzug.down({ step: 99 });

      console.log(`✅ Tenant reverse migrated: ${schema}`);
    }

    console.log('🎉 All reverse migrations completed');
  }
  catch (err) {
    console.error(
      '❌ Reverse Migration error:',
      err instanceof Error ? err.message : err,
    );
  }
}
