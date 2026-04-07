import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.addColumn(
    { tableName: 'platform_product', schema },
    'variant',
    {
      allowNull: true,
      type: DataTypes.STRING,
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.removeColumn(
    { tableName: 'platform_product', schema },
    'variant',
  );
};
