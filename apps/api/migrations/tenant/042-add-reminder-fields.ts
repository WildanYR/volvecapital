import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.addColumn(
    { tableName: 'product_variant', schema },
    'reminder_before_hours',
    {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  );
  await queryInterface.addColumn(
    { tableName: 'account_user', schema },
    'is_reminder_sent',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.removeColumn({ tableName: 'product_variant', schema }, 'reminder_before_hours');
  await queryInterface.removeColumn({ tableName: 'account_user', schema }, 'is_reminder_sent');
};
