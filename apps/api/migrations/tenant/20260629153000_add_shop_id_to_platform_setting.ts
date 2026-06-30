import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  await queryInterface.addColumn(
    { schema, tableName: 'platform_accounting_setting' },
    'shop_id',
    {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: { schema, tableName: 'shop' },
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  await queryInterface.removeColumn(
    { schema, tableName: 'platform_accounting_setting' },
    'shop_id'
  );
};
