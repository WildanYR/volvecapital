import { DataTypes } from 'sequelize';

export const up = async ({ context: sequelize }: { context: any }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.addColumn('product_variant', 'inventory_coa_id', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });

  await queryInterface.addColumn('product_variant', 'deferred_revenue_coa_id', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });

  await queryInterface.addColumn('product_variant', 'revenue_coa_id', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
};

export const down = async ({ context: sequelize }: { context: any }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.removeColumn('product_variant', 'inventory_coa_id');
  await queryInterface.removeColumn('product_variant', 'deferred_revenue_coa_id');
  await queryInterface.removeColumn('product_variant', 'revenue_coa_id');
};
