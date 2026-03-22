import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (transaction) => {
    // 1) Create table
    await queryInterface.createTable(
      { tableName: 'revenue_statistics', schema },
      {
        date: {
          type: DataTypes.DATEONLY, // Postgres DATE
          allowNull: false,
          primaryKey: true, // composite PK (date,type)
        },
        type: {
          type: DataTypes.STRING(7), // 'daily' | 'monthly'
          allowNull: false,
          primaryKey: true, // composite PK (date,type)
        },
        total_revenue: {
          // gunakan BIGINT agar aman (pakai minor units/cent)
          type: DataTypes.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        transaction_count: {
          type: DataTypes.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          // pakai CURRENT_TIMESTAMP (timestamptz di PG)
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

    // 2) CHECK constraint untuk type (hindari ENUM agar aman multi-tenant)
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."revenue_statistics"
       ADD CONSTRAINT "revenue_statistics_type_chk"
       CHECK (type IN ('daily','monthly'));`,
      { transaction },
    );

    // 3) Storage parameter: fillfactor (opsional tapi disarankan untuk upsert sering)
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."revenue_statistics" SET (fillfactor=90);`,
      { transaction },
    );

    // 4) Partial indexes (opsional)
    //    Percepat query yang spesifik ke satu tipe (daily/monthly)
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "revenue_statistics_daily_date_idx"
       ON "${schema}"."revenue_statistics" ("date")
       WHERE type = 'daily';`,
      { transaction },
    );

    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "revenue_statistics_monthly_date_idx"
       ON "${schema}"."revenue_statistics" ("date")
       WHERE type = 'monthly';`,
      { transaction },
    );

    // (Opsional) Trigger untuk auto-update updated_at:
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS "revenue_statistics_set_updated_at"
        ON "${schema}"."revenue_statistics";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `CREATE TRIGGER "revenue_statistics_set_updated_at"
        BEFORE UPDATE ON "${schema}"."revenue_statistics"
        FOR EACH ROW EXECUTE FUNCTION "${schema}"."touch_updated_at"();`,
      { transaction },
    );
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (transaction) => {
    // Drop indexes & constraints eksplisit (optional, dropTable sudah cukup)
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${schema}"."revenue_statistics_daily_date_idx";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${schema}"."revenue_statistics_monthly_date_idx";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."revenue_statistics"
       DROP CONSTRAINT IF EXISTS "revenue_statistics_type_chk";`,
      { transaction },
    );

    // (Opsional) drop trigger & function jika kamu aktifkan “touch_updated_at”
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS "revenue_statistics_set_updated_at"
        ON "${schema}"."revenue_statistics";`,
      { transaction },
    );

    await queryInterface.dropTable(
      { tableName: 'revenue_statistics', schema },
      { transaction },
    );
  });
};
