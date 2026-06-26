import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  await queryInterface.addColumn(
    { schema, tableName: 'manual_book_category' },
    'parent_id',
    {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: {
          tableName: 'manual_book_category',
          schema,
        },
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema))
    return;

  await queryInterface.removeColumn({ schema, tableName: 'manual_book_category' }, 'parent_id');
};
