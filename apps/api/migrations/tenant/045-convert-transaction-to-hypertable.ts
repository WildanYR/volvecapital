import type { MigrationContext } from '../migrator';

/**
 * Convert the `transaction` table to a TimescaleDB hypertable.
 * Partitioned by `created_at` for efficient time-range queries.
 * The migration is wrapped in try/catch so it degrades gracefully
 * if the TimescaleDB extension is not yet installed.
 */
export async function up({ queryInterface, schema }: MigrationContext) {
  try {
    await queryInterface.sequelize.query(
      `SELECT create_hypertable(
        '"${schema}"."transaction"',
        'created_at',
        migrate_data => true,
        if_not_exists => true
      );`,
    );
    console.log(`✅ Hypertable created for ${schema}.transaction`);
  }
  catch (e) {
    console.warn(
      `⚠️  Could not convert ${schema}.transaction to hypertable. ` +
      'Is the TimescaleDB extension installed? Error:',
      (e as Error).message,
    );
  }
}

export async function down({ queryInterface: _q, schema: _s }: MigrationContext) {
  // Converting a hypertable back to a regular table is destructive and
  // not straightforward. This migration is intentionally non-reversible.
  console.warn('⚠️  down() for hypertable conversion is a no-op. Revert manually if needed.');
}

