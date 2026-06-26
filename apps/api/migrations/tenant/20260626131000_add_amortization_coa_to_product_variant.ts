import { DataTypes } from 'sequelize';
import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  try {
    await queryInterface.addColumn({ tableName: 'product_variant', schema }, 'inventory_coa_id', {
      type: DataTypes.BIGINT,
      allowNull: true,
    });
  } catch (e: any) {
    if (e.message && !e.message.includes('already exists')) throw e;
  }

  try {
    await queryInterface.addColumn({ tableName: 'product_variant', schema }, 'deferred_revenue_coa_id', {
      type: DataTypes.BIGINT,
      allowNull: true,
    });
  } catch (e: any) {
    if (e.message && !e.message.includes('already exists')) throw e;
  }

  try {
    await queryInterface.addColumn({ tableName: 'product_variant', schema }, 'revenue_coa_id', {
      type: DataTypes.BIGINT,
      allowNull: true,
    });
  } catch (e: any) {
    if (e.message && !e.message.includes('already exists')) throw e;
  }
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.removeColumn({ tableName: 'product_variant', schema }, 'inventory_coa_id');
  await queryInterface.removeColumn({ tableName: 'product_variant', schema }, 'deferred_revenue_coa_id');
  await queryInterface.removeColumn({ tableName: 'product_variant', schema }, 'revenue_coa_id');
};
