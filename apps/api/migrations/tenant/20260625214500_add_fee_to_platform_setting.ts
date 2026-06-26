import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    const tableDesc = await queryInterface.describeTable({ schema, tableName: 'platform_accounting_setting' });
    
    if (!tableDesc['fee_type']) {
      await queryInterface.addColumn({ schema, tableName: 'platform_accounting_setting' }, 'fee_type', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'FIXED', // 'FIXED' or 'PERCENTAGE'
      });
    }

    if (!tableDesc['fee_amount']) {
      await queryInterface.addColumn({ schema, tableName: 'platform_accounting_setting' }, 'fee_amount', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  } catch (err: any) {
    console.log(`Error adding fee columns to platform_accounting_setting in schema ${schema}:`, err.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.removeColumn({ schema, tableName: 'platform_accounting_setting' }, 'fee_type');
    await queryInterface.removeColumn({ schema, tableName: 'platform_accounting_setting' }, 'fee_amount');
  } catch (e) {
    // ignore
  }
};
