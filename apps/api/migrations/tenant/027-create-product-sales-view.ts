import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

const TRANSACTION_ITEM_HYPERTABLE = 'transaction_item_ts';
const DAILY_PRODUCT_SALES_STATS = 'daily_product_sales_stats';
const MONTHLY_PRODUCT_SALES_STATS = 'monthly_product_sales_stats';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  // DAILY
  await queryInterface.sequelize.query(`
    CREATE MATERIALIZED VIEW ${schema}.${DAILY_PRODUCT_SALES_STATS}
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 day', created_at) AS bucket,
        product_id,
        product_variant_id,
        COUNT(id) AS total_transaction,
        SUM(price) AS revenue
    FROM ${schema}.${TRANSACTION_ITEM_HYPERTABLE}
    GROUP BY time_bucket('1 day', created_at), product_id, product_variant_id;
  `);

  await queryInterface.sequelize.query(`
    SELECT add_retention_policy(
    '${schema}.${DAILY_PRODUCT_SALES_STATS}',
    INTERVAL '1 year');
  `);

  await queryInterface.sequelize.query(`
    SELECT add_continuous_aggregate_policy(
      '${schema}.${DAILY_PRODUCT_SALES_STATS}',
      start_offset => INTERVAL '7 days',
      end_offset   => INTERVAL '10 minutes',
      schedule_interval => INTERVAL '3 hours'
    );
  `);

  // MONTHLY
  await queryInterface.sequelize.query(`
    CREATE MATERIALIZED VIEW ${schema}.${MONTHLY_PRODUCT_SALES_STATS}
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 month', bucket) AS bucket_month,
        product_id,
        product_variant_id,
        SUM(total_transaction) AS total_transaction,
        SUM(revenue) AS revenue
    FROM ${schema}.${DAILY_PRODUCT_SALES_STATS}
    GROUP BY time_bucket('1 month', bucket), product_id, product_variant_id;
  `);

  await queryInterface.sequelize.query(`
    SELECT add_continuous_aggregate_policy(
      '${schema}.${MONTHLY_PRODUCT_SALES_STATS}',
      start_offset => INTERVAL '6 months',
      end_offset   => INTERVAL '10 minutes',
      schedule_interval => INTERVAL '1 day'
    );
  `);
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`DROP MATERIALIZED VIEW IF EXISTS ${schema}.${MONTHLY_PRODUCT_SALES_STATS};`);
  await queryInterface.sequelize.query(`DROP MATERIALIZED VIEW IF EXISTS ${schema}.${DAILY_PRODUCT_SALES_STATS};`);
};
