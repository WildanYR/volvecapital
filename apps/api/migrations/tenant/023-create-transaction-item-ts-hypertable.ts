import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (tx) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE ${schema}.transaction_item_ts (
        id BIGSERIAL NOT NULL,
        transaction_id VARCHAR NOT NULL,
        price BIGINT NOT NULL,
        account_id BIGINT,
        account_user_id BIGINT,
        product_id BIGINT,
        product_variant_id BIGINT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        PRIMARY KEY (id, created_at)
      );
    `, { transaction: tx });

    await queryInterface.sequelize.query(`SELECT create_hypertable('${schema}.transaction_item_ts', 'created_at');`, { transaction: tx });
    await queryInterface.sequelize.query(`SELECT add_retention_policy('${schema}.transaction_item_ts', INTERVAL '1 year');`, { transaction: tx });
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_item_transaction_id
      ON ${schema}.transaction_item_ts (transaction_id, created_at DESC);  
    `, { transaction: tx });
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_item_account_time
      ON ${schema}.transaction_item_ts (account_id, created_at DESC)
      WHERE account_id IS NOT NULL;
    `, { transaction: tx });
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_item_product_variant_time
      ON ${schema}.transaction_item_ts (product_id, product_variant_id, created_at DESC)
      WHERE product_id IS NOT NULL;
    `, { transaction: tx });
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`SELECT remove_retention_policy('${schema}.transaction_item_ts', if_exists => true);`).catch(() => {});
  await queryInterface.dropTable({ tableName: 'transaction_item_ts', schema });
};
