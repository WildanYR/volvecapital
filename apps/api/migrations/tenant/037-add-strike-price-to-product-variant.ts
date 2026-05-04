import { MigrationContext } from '../migrator';
import { DataType } from 'sequelize-typescript';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.addColumn(
    { tableName: 'product_variant', schema },
    'strike_price',
    {
      type: DataType.INTEGER,
      allowNull: true,
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.removeColumn(
    { tableName: 'product_variant', schema },
    'strike_price',
  );
};
