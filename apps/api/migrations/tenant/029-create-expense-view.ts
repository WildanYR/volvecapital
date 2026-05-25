import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

const EXPENSE_HYPERTABLE = 'expense';
const DAILY_EXPENSE_STATS = 'daily_expense_stats';
const MONTHLY_EXPENSE_STATS = 'monthly_expense_stats';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  // DAILY
  await queryInterface.sequelize.query(`
    CREATE MATERIALIZED VIEW ${schema}.${DAILY_EXPENSE_STATS}
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 day', created_at) AS bucket,
        type,
        subject_id,
        COUNT(id) AS total_expense_count,
        SUM(amount) AS total_expense_amount
    FROM ${schema}.${EXPENSE_HYPERTABLE}
    GROUP BY time_bucket('1 day', created_at), type, subject_id;
  `);

  await queryInterface.sequelize.query(`
    SELECT add_retention_policy(
      '${schema}.${DAILY_EXPENSE_STATS}',
      INTERVAL '1 year'
    );
  `);

  await queryInterface.sequelize.query(`
    SELECT add_continuous_aggregate_policy(
      '${schema}.${DAILY_EXPENSE_STATS}',
      start_offset => INTERVAL '7 days',
      end_offset   => INTERVAL '10 minutes',
      schedule_interval => INTERVAL '3 hours'
    );
  `);

  // MONTHLY
  await queryInterface.sequelize.query(`
    CREATE MATERIALIZED VIEW ${schema}.${MONTHLY_EXPENSE_STATS}
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 month', bucket) AS bucket_month,
        type,
        subject_id,
        SUM(total_expense_count) AS total_expense_count,
        SUM(total_expense_amount) AS total_expense_amount
    FROM ${schema}.${DAILY_EXPENSE_STATS}
    GROUP BY time_bucket('1 month', bucket), type, subject_id;
  `);

  await queryInterface.sequelize.query(`
    SELECT add_continuous_aggregate_policy(
      '${schema}.${MONTHLY_EXPENSE_STATS}',
      start_offset => INTERVAL '6 months',
      end_offset   => INTERVAL '10 minutes',
      schedule_interval => INTERVAL '1 day'
    );
  `);
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`DROP MATERIALIZED VIEW IF EXISTS ${schema}.${MONTHLY_EXPENSE_STATS};`);
  await queryInterface.sequelize.query(`DROP MATERIALIZED VIEW IF EXISTS ${schema}.${DAILY_EXPENSE_STATS};`);
};
