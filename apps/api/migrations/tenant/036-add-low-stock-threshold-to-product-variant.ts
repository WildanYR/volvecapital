import { MigrationContext } from '../migrator';
import { DataType } from 'sequelize-typescript';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.addColumn(
    { tableName: 'product_variant', schema },
    'low_stock_threshold',
    {
      type: DataType.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.removeColumn(
    { tableName: 'product_variant', schema },
    'low_stock_threshold',
  );
};
