import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.addColumn({ tableName: 'tenant', schema }, 'custom_domain', {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.removeColumn({ tableName: 'tenant', schema }, 'custom_domain');
};
