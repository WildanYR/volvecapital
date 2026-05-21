import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.addColumn(
    { tableName: 'product_variant', schema },
    'base_price',
    {
      allowNull: true,
      type: DataTypes.BIGINT,
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.removeColumn(
    { tableName: 'product_variant', schema },
    'base_price',
  );
};
