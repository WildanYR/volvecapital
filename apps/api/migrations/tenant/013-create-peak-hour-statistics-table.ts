import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (transaction) => {
    // 1) Create table
    await queryInterface.createTable(
      { tableName: 'peak_hour_statistics', schema },
      {
        date: {
          type: DataTypes.DATEONLY, // Postgres DATE
          allowNull: false,
          primaryKey: true, // PK (1/3)
        },
        type: {
          type: DataTypes.STRING(7), // 'daily' | 'monthly'
          allowNull: false,
          primaryKey: true, // PK (2/3)
        },
        hour: {
          type: DataTypes.SMALLINT, // 0..23
          allowNull: false,
          primaryKey: true, // PK (3/3)
        },
        transaction_count: {
          type: DataTypes.BIGINT, // lebih aman untuk hitungan besar
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: NOW,
        },
      },
      { transaction },
    );

    // 2) CHECK constraint untuk type
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."peak_hour_statistics"
       ADD CONSTRAINT "peak_hour_statistics_type_chk"
       CHECK (type IN ('daily','monthly'));`,
      { transaction },
    );

    // 3) CHECK constraint untuk hour 0..23
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."peak_hour_statistics"
       ADD CONSTRAINT "peak_hour_statistics_hour_chk"
       CHECK (hour BETWEEN 0 AND 23);`,
      { transaction },
    );

    // 4) Storage parameter: fillfactor (disarankan untuk upsert sering)
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."peak_hour_statistics" SET (fillfactor=90);`,
      { transaction },
    );

    // 5) Partial indexes (opsional — hapus jika belum perlu)
    //    Mempercepat baca per tipe untuk satu tanggal.
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "phs_daily_date_idx"
       ON "${schema}"."peak_hour_statistics" ("date")
       WHERE type = 'daily';`,
      { transaction },
    );

    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "phs_monthly_date_idx"
       ON "${schema}"."peak_hour_statistics" ("date")
       WHERE type = 'monthly';`,
      { transaction },
    );

    // (Opsional) Trigger auto-update updated_at
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS "peak_hour_statistics_set_updated_at"
         ON "${schema}"."peak_hour_statistics";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `CREATE TRIGGER "peak_hour_statistics_set_updated_at"
         BEFORE UPDATE ON "${schema}"."peak_hour_statistics"
         FOR EACH ROW EXECUTE FUNCTION "${schema}"."touch_updated_at"();`,
      { transaction },
    );
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (transaction) => {
    // Drop indexes & constraints (opsional)
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${schema}"."phs_daily_date_idx";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${schema}"."phs_monthly_date_idx";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."peak_hour_statistics"
       DROP CONSTRAINT IF EXISTS "peak_hour_statistics_type_chk";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."peak_hour_statistics"
       DROP CONSTRAINT IF EXISTS "peak_hour_statistics_hour_chk";`,
      { transaction },
    );

    // (Opsional) drop trigger & function jika diaktifkan
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS "peak_hour_statistics_set_updated_at"
         ON "${schema}"."peak_hour_statistics";`,
      { transaction },
    );

    await queryInterface.dropTable(
      { tableName: 'peak_hour_statistics', schema },
      { transaction },
    );
  });
};
