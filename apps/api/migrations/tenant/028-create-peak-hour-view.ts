import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

const TRANSACTION_HYPERTABLE = 'transaction_ts';
const PEAK_HOUR_STATS = 'peak_hour_stats';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  // DAILY
  await queryInterface.sequelize.query(`
    CREATE MATERIALIZED VIEW ${schema}.${PEAK_HOUR_STATS}
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 hour', created_at) AS bucket,
        COUNT(id) AS total_transaction
    FROM ${schema}.${TRANSACTION_HYPERTABLE}
    GROUP BY time_bucket('1 hour', created_at);
  `);

  await queryInterface.sequelize.query(`
    SELECT add_retention_policy(
      '${schema}.${PEAK_HOUR_STATS}', 
      INTERVAL '5 year'
    );
  `);

  await queryInterface.sequelize.query(`
    SELECT add_continuous_aggregate_policy(
      '${schema}.${PEAK_HOUR_STATS}',
      start_offset => INTERVAL '3 days',
      end_offset   => INTERVAL '10 minutes',
      schedule_interval => INTERVAL '3 hours'
    );
  `);

  // Contoh select data bulanan
  /**
   SELECT
    EXTRACT(HOUR FROM raw_hour_bucket) AS operational_hour, -- Jam 0 sampai 23
    SUM(total_transaction) AS total_transactions
    FROM ${schema}.${MONTHLY_PEAK_HOUR_STATS}
    WHERE bucket_month = '2026-05-01 00:00:00+00' -- Contoh untuk memfilter bulan Mei 2026
    GROUP BY operational_hour
    ORDER BY total_transactions DESC; -- Urutkan dari yang paling ramai ke paling sepi
   */
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.sequelize.query(`DROP MATERIALIZED VIEW IF EXISTS ${schema}.${PEAK_HOUR_STATS};`);
};
