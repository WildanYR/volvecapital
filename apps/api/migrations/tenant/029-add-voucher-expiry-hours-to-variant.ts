import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  try {
    await queryInterface.addColumn(
      { schema, tableName: 'product_variant' },
      'voucher_expiry_hours',
      {
        type: DataTypes.INTEGER,
        allowNull: true,
      }
    );
  } catch (err) {
    // Skip if already exists
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.removeColumn(
    { schema, tableName: 'product_variant' },
    'voucher_expiry_hours'
  );
};
