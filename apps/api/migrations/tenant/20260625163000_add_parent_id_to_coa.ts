import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  // Add parent_id column to coa
  await queryInterface.addColumn(
    { schema, tableName: 'coa' },
    'parent_id',
    {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: { tableName: 'coa', schema },
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
    { schema, tableName: 'coa' },
    'parent_id'
  );
};
