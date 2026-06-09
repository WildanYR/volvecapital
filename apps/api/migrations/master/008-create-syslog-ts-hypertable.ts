import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE ${schema}.syslog_ts (
        id BIGINT GENERATED ALWAYS AS IDENTITY,
        level VARCHAR NOT NULL,
        context VARCHAR NOT NULL,
        message TEXT NOT NULL,
        stack TEXT,
        tenant_id VARCHAR,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        PRIMARY KEY (id, created_at)
      );
    `, { transaction: tx });

    await queryInterface.sequelize.query(`SELECT create_hypertable('${schema}.syslog_ts', 'created_at');`, { transaction: tx });
    await queryInterface.sequelize.query(`SELECT add_retention_policy('${schema}.syslog_ts', INTERVAL '7 days');`, { transaction: tx });

    // Index Use Case 1 & 2: Cari berdasar Tenant + Level
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_logs_ts_tenant_level_time
      ON ${schema}.syslog_ts (tenant_id, level, created_at DESC);
    `, { transaction: tx });

    // Index Use Case 3: Cari berdasar Tenant + Context
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_logs_ts_tenant_context_time
      ON ${schema}.syslog_ts (tenant_id, context, created_at DESC);
    `, { transaction: tx });
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`SELECT remove_retention_policy('${schema}.syslog_ts', if_exists => true);`).catch(() => {});
  await queryInterface.dropTable({ tableName: 'syslog_ts', schema });
};
