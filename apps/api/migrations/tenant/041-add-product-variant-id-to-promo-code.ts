import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.addColumn(
    { tableName: 'promo_code', schema },
    'product_variant_id',
    {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: { tableName: 'product_variant', schema },
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.removeColumn({ tableName: 'promo_code', schema }, 'product_variant_id');
};
