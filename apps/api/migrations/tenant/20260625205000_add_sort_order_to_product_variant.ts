import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    const tableDesc = await queryInterface.describeTable({ schema, tableName: 'product_variant' });
    if (!tableDesc['sort_order']) {
      await queryInterface.addColumn({ schema, tableName: 'product_variant' }, 'sort_order', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  } catch (err: any) {
    console.log(`Error adding sort_order to product_variant in schema ${schema}:`, err.message);
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  try {
    await queryInterface.removeColumn({ schema, tableName: 'product_variant' }, 'sort_order');
  } catch (e) {
    // ignore
  }
};
