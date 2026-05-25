import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

const TRANSACTION_HYPERTABLE = 'transaction_ts';
const DAILY_PLATFORM_STATS = 'daily_platform_stats';
const MONTHLY_PLATFORM_STATS = 'monthly_platform_stats';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  // DAILY
  await queryInterface.sequelize.query(`
    CREATE MATERIALIZED VIEW ${schema}.${DAILY_PLATFORM_STATS}
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 day', created_at) AS bucket,
        platform,
        COUNT(id) AS total_transaction,
        SUM(total_price) AS revenue
    FROM ${schema}.${TRANSACTION_HYPERTABLE}
    GROUP BY time_bucket('1 day', created_at), platform;
  `);

  await queryInterface.sequelize.query(`
    SELECT add_retention_policy(
    '${schema}.${DAILY_PLATFORM_STATS}',
    INTERVAL '1 year');
  `);

  await queryInterface.sequelize.query(`
    SELECT add_continuous_aggregate_policy(
      '${schema}.${DAILY_PLATFORM_STATS}',
      start_offset => INTERVAL '7 days',
      end_offset   => INTERVAL '10 minutes',
      schedule_interval => INTERVAL '3 hours'
    );
  `);

  // MONTHLY
  await queryInterface.sequelize.query(`
    CREATE MATERIALIZED VIEW ${schema}.${MONTHLY_PLATFORM_STATS}
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 month', bucket) AS bucket_month,
        platform,
        SUM(total_transaction) AS total_transaction,
        SUM(revenue) AS revenue
    FROM ${schema}.${DAILY_PLATFORM_STATS}
    GROUP BY time_bucket('1 month', bucket), platform;
  `);

  await queryInterface.sequelize.query(`
    SELECT add_continuous_aggregate_policy(
      '${schema}.${MONTHLY_PLATFORM_STATS}',
      start_offset => INTERVAL '6 months',
      end_offset   => INTERVAL '10 minutes',
      schedule_interval => INTERVAL '1 day'
    );
  `);
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`DROP MATERIALIZED VIEW IF EXISTS ${schema}.${MONTHLY_PLATFORM_STATS};`);
  await queryInterface.sequelize.query(`DROP MATERIALIZED VIEW IF EXISTS ${schema}.${DAILY_PLATFORM_STATS};`);
};
