import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.changeColumn(
      { schema, tableName: 'platform_accounting_setting' },
      'fee_amount',
      {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      }
    );
  } catch (err: any) {
    console.log(`Error altering fee_amount in platform_accounting_setting in schema ${schema}:`, err.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.changeColumn(
      { schema, tableName: 'platform_accounting_setting' },
      'fee_amount',
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    );
  } catch (e) {
    // ignore
  }
};
