import { DataType } from 'sequelize-typescript';
import { MigrationFn } from 'umzug';
import { MigrationContext } from '../migrator';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.addColumn(
    { tableName: 'account', schema },
    'capital_price',
    {
      type: DataType.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.removeColumn(
    { tableName: 'account', schema },
    'capital_price',
  );
};
