import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  // 1. Add income_coa_id to product_variant
  try {
    const tableDesc = await queryInterface.describeTable({ schema, tableName: 'product_variant' });
    if (!tableDesc['income_coa_id']) {
      await queryInterface.addColumn({ schema, tableName: 'product_variant' }, 'income_coa_id', {
        type: DataTypes.BIGINT,
        allowNull: true,
      });
    }
  } catch (err: any) {
    console.log(`Error adding income_coa_id to product_variant in schema ${schema}:`, err.message);
  }

  // 2. Create platform_accounting_setting table
  try {
    await queryInterface.createTable({ schema, tableName: 'platform_accounting_setting' }, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      platform: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      asset_coa_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      expense_coa_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  } catch (err: any) {
    if (err.message && !err.message.includes('already exists')) {
      console.log(`Error creating platform_accounting_setting in schema ${schema}:`, err.message);
    }
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.removeColumn({ schema, tableName: 'product_variant' }, 'income_coa_id');
    await queryInterface.dropTable({ schema, tableName: 'platform_accounting_setting' });
  } catch (e) {
    // ignore
  }
};
