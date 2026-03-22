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
  return new Umzug({
    migrations: { glob: path.join(__dirname, folder, '*.{ts,js}') },
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

    const schemas = CONFIG.TENANT_SCHEMAS.split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (schemas.length === 0) {
      console.warn('⚠️ No tenant schemas defined in TENANT_SCHEMAS');
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

    const schemas = CONFIG.TENANT_SCHEMAS.split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (schemas.length === 0) {
      console.warn('⚠️ No tenant schemas defined in TENANT_SCHEMAS');
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
