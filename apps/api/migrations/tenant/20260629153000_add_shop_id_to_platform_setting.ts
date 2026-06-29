import { DataTypes, QueryInterface } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.addColumn('platform_accounting_setting', 'shop_id', {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'shop',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.removeColumn('platform_accounting_setting', 'shop_id');
};
