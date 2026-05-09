import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.addColumn(
    { tableName: 'voucher', schema },
    'promo_code_id',
    {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'promo_code',
        key: 'id',
      },
    },
  );

  await queryInterface.addColumn(
    { tableName: 'voucher', schema },
    'discount_amount',
    {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.removeColumn({ tableName: 'voucher', schema }, 'promo_code_id');
  await queryInterface.removeColumn({ tableName: 'voucher', schema }, 'discount_amount');
};
