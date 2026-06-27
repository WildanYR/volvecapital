import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    // Add is_active column to coa
    await queryInterface.addColumn(
      { schema, tableName: 'coa' },
      'is_active',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      }
    );
  } catch (err: any) {
    console.log(`Column is_active might already exist:`, err.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  await queryInterface.removeColumn(
    { schema, tableName: 'coa' },
    'is_active'
  );
};
