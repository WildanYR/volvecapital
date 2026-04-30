import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.addColumn({ tableName: 'tenant_owner', schema }, 'reset_token', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn({ tableName: 'tenant_owner', schema }, 'reset_expires', {
    type: DataTypes.DATE,
    allowNull: true,
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.removeColumn({ tableName: 'tenant_owner', schema }, 'reset_token');
  await queryInterface.removeColumn({ tableName: 'tenant_owner', schema }, 'reset_expires');
};
