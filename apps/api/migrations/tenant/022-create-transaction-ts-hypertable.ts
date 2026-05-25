import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE ${schema}.transaction_ts (
        id VARCHAR NOT NULL,
        customer VARCHAR NOT NULL,
        platform VARCHAR NOT NULL,
        total_price INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        PRIMARY KEY (id, created_at)
      );
    `, { transaction: tx });

    await queryInterface.sequelize.query(`SELECT create_hypertable('${schema}.transaction_ts', 'created_at');`, { transaction: tx });
    await queryInterface.sequelize.query(`SELECT add_retention_policy('${schema}.transaction_ts', INTERVAL '1 year');`, { transaction: tx });
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_transaction_platform_time
      ON ${schema}.transaction_ts (platform, created_at DESC);
    `, { transaction: tx });
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`SELECT remove_retention_policy('${schema}.transaction_ts', if_exists => true);`).catch(() => {});
  await queryInterface.dropTable({ tableName: 'transaction_ts', schema });
};
