import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    const tableDesc = await queryInterface.describeTable({ schema, tableName: 'account_capital' });

    try {
      if (!tableDesc['asset_coa_id']) {
        await queryInterface.addColumn(
          { schema, tableName: 'account_capital' },
          'asset_coa_id',
          {
            type: DataTypes.BIGINT,
            allowNull: true,
          }
        );
      }
      if (!tableDesc['expense_coa_id']) {
        await queryInterface.addColumn(
          { schema, tableName: 'account_capital' },
          'expense_coa_id',
          {
            type: DataTypes.BIGINT,
            allowNull: true,
          }
        );
      }
    } catch (e: any) {
      console.log('Error adding coa to account_capital:', e.message);
    }
  } catch (err: any) {
    console.log(`Error adding COA columns to account_capital in schema ${schema}:`, err.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.removeColumn({ schema, tableName: 'account_capital' }, 'payment_coa_id');
    await queryInterface.removeColumn({ schema, tableName: 'account_capital' }, 'expense_coa_id');
  } catch (e) {
    // ignore
  }
};
