import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (transaction) => {
    // 1) Create table
    await queryInterface.createTable(
      { tableName: 'platform_statistics', schema },
      {
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          primaryKey: true, // PK (1/3)
        },
        type: {
          type: DataTypes.STRING(7), // 'daily' | 'monthly'
          allowNull: false,
          primaryKey: true, // PK (2/3)
        },
        platform: {
          // batasi panjang secukupnya agar index efisien; sesuaikan jika perlu
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true, // PK (3/3)
        },
        transaction_count: {
          type: DataTypes.BIGINT, // aman untuk agregat besar
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
      `ALTER TABLE "${schema}"."platform_statistics"
       ADD CONSTRAINT "platform_statistics_type_chk"
       CHECK (type IN ('daily','monthly'));`,
      { transaction },
    );

    // 3) Storage parameter: fillfactor
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."platform_statistics" SET (fillfactor=90);`,
      { transaction },
    );

    // 4) Partial indexes (opsional — hapus jika belum perlu)
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "pls_daily_date_idx"
       ON "${schema}"."platform_statistics" ("date")
       WHERE type = 'daily';`,
      { transaction },
    );

    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "pls_monthly_date_idx"
       ON "${schema}"."platform_statistics" ("date")
       WHERE type = 'monthly';`,
      { transaction },
    );

    // (Opsional) Trigger auto-update updated_at
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS "platform_statistics_set_updated_at"
         ON "${schema}"."platform_statistics";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `CREATE TRIGGER "platform_statistics_set_updated_at"
         BEFORE UPDATE ON "${schema}"."platform_statistics"
         FOR EACH ROW EXECUTE FUNCTION "${schema}"."touch_updated_at"();`,
      { transaction },
    );
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (transaction) => {
    // Drop indexes & constraints (opsional; dropTable umumnya cukup)
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${schema}"."pls_daily_date_idx";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${schema}"."pls_monthly_date_idx";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."platform_statistics"
       DROP CONSTRAINT IF EXISTS "platform_statistics_type_chk";`,
      { transaction },
    );

    // (Opsional) drop trigger & function jika kamu aktifkan
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS "platform_statistics_set_updated_at"
         ON "${schema}"."platform_statistics";`,
      { transaction },
    );

    await queryInterface.dropTable(
      { tableName: 'platform_statistics', schema },
      { transaction },
    );
  });
};
