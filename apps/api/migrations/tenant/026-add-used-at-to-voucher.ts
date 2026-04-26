import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.addColumn({ tableName: 'voucher', schema }, 'used_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.removeColumn({ tableName: 'voucher', schema }, 'used_at');
};
