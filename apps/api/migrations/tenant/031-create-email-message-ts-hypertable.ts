import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE ${schema}.email_message_ts (
        id BIGINT GENERATED ALWAYS AS IDENTITY,
        tenant_id VARCHAR NOT NULL,
        from_email VARCHAR NOT NULL,
        subject VARCHAR NOT NULL,
        email_date TIMESTAMP WITH TIME ZONE NOT NULL,
        parsed_context VARCHAR NOT NULL,
        parsed_data TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        PRIMARY KEY (id, created_at)
      );
    `, { transaction: tx });

    await queryInterface.sequelize.query(`SELECT create_hypertable('${schema}.email_message_ts', 'created_at');`, { transaction: tx });
    await queryInterface.sequelize.query(`SELECT add_retention_policy('${schema}.email_message_ts', INTERVAL '3 days');`, { transaction: tx });
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`SELECT remove_retention_policy('${schema}.email_message_ts', if_exists => true);`).catch(() => {});
  await queryInterface.dropTable({ tableName: 'email_message_ts', schema });
};
