import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    const tableDesc = await queryInterface.describeTable({ schema, tableName: 'account_capital' });
    if (tableDesc['asset_coa_id'] && !tableDesc['payment_coa_id']) {
      await queryInterface.renameColumn(
        { schema, tableName: 'account_capital' },
        'asset_coa_id',
        'payment_coa_id'
      );
    }
  } catch (error) {
    console.log(`Error renaming column in ${schema}:`, error.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    const tableDesc = await queryInterface.describeTable({ schema, tableName: 'account_capital' });
    if (tableDesc['payment_coa_id'] && !tableDesc['asset_coa_id']) {
      await queryInterface.renameColumn(
        { schema, tableName: 'account_capital' },
        'payment_coa_id',
        'asset_coa_id'
      );
    }
  } catch (error) {
    console.log(`Error reverting column rename in ${schema}:`, error.message);
  }
};
