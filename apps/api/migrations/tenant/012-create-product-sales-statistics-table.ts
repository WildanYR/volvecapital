import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (transaction) => {
    // 1) Create table
    await queryInterface.createTable(
      { tableName: 'product_sales_statistics', schema },
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
        product_variant_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true, // PK (3/3)
        },
        items_sold: {
          type: DataTypes.BIGINT, // gunakan BIGINT untuk aman
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
      `ALTER TABLE "${schema}"."product_sales_statistics"
       ADD CONSTRAINT "product_sales_statistics_type_chk"
       CHECK (type IN ('daily','monthly'));`,
      { transaction },
    );

    // 3) Storage parameter: fillfactor (disarankan untuk upsert sering)
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."product_sales_statistics" SET (fillfactor=90);`,
      { transaction },
    );

    // 4) Partial indexes (opsional — hapus jika belum perlu)
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "pss_daily_date_idx"
       ON "${schema}"."product_sales_statistics" ("date")
       WHERE type = 'daily';`,
      { transaction },
    );

    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "pss_monthly_date_idx"
       ON "${schema}"."product_sales_statistics" ("date")
       WHERE type = 'monthly';`,
      { transaction },
    );

    // (Opsional) Trigger auto-update updated_at
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS "product_sales_statistics_set_updated_at"
         ON "${schema}"."product_sales_statistics";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `CREATE TRIGGER "product_sales_statistics_set_updated_at"
         BEFORE UPDATE ON "${schema}"."product_sales_statistics"
         FOR EACH ROW EXECUTE FUNCTION "${schema}"."touch_updated_at"();`,
      { transaction },
    );
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.sequelize.transaction(async (transaction) => {
    // Drop indexes & constraints (opsional, dropTable biasanya cukup)
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${schema}"."pss_daily_date_idx";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${schema}"."pss_monthly_date_idx";`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."product_sales_statistics"
       DROP CONSTRAINT IF EXISTS "product_sales_statistics_type_chk";`,
      { transaction },
    );

    // (Opsional) drop trigger & function jika diaktifkan
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS "product_sales_statistics_set_updated_at"
         ON "${schema}"."product_sales_statistics";`,
      { transaction },
    );

    await queryInterface.dropTable(
      { tableName: 'product_sales_statistics', schema },
      { transaction },
    );
  });
};
