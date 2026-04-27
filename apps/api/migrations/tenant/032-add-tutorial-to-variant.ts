import { MigrationContext } from '../migrator';
import { DataType } from 'sequelize-typescript';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.addColumn(
    { tableName: 'product_variant', schema },
    'tutorial_id',
    {
      type: DataType.UUID,
      allowNull: true,
      references: {
        model: {
          tableName: 'tutorial',
          schema,
        },
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.removeColumn(
    { tableName: 'product_variant', schema },
    'tutorial_id',
  );
};
