import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE ${schema}.expense (
        id BIGSERIAL NOT NULL,
        subject_id BIGINT,
        type VARCHAR(50) NOT NULL DEFAULT 'global',
        amount BIGINT NOT NULL,
        note VARCHAR,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        PRIMARY KEY (id, created_at)
      );
    `, { transaction: tx });

    await queryInterface.sequelize.query(`SELECT create_hypertable('${schema}.expense', 'created_at');`, { transaction: tx });
    await queryInterface.sequelize.query(`SELECT add_retention_policy('${schema}.expense', INTERVAL '1 year');`, { transaction: tx });
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_expense_polymorphic 
      ON ${schema}.expense (type, subject_id, created_at DESC) 
      WHERE subject_id IS NOT NULL;
    `, { transaction: tx });
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_expense_global_time 
      ON ${schema}.expense (created_at DESC) 
      WHERE type = 'global' AND subject_id IS NULL;
    `, { transaction: tx });
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`SELECT remove_retention_policy('${schema}.expense', if_exists => true);`).catch(() => {});
  await queryInterface.dropTable({ tableName: 'expense', schema });
};
