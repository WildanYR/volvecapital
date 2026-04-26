import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.addColumn('product_variant', 'voucher_expiry_hours', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('product_variant', 'voucher_expiry_hours');
}
