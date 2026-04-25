import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'voucher', schema },
    {
      id: {
        primaryKey: true,
        type: DataTypes.STRING(12),
        allowNull: false,
      },
      product_variant_id: {
        allowNull: false,
        type: DataTypes.BIGINT,
      },
      status: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: 'UNUSED',
      },
      buyer_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      buyer_email: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      buyer_whatsapp: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      expired_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      transaction_id: {
        type: DataTypes.STRING,
      },
      transaction_item_id: {
        type: DataTypes.BIGINT,
      },
      payment_id: {
        type: DataTypes.STRING,
      },
      payment_status: {
        type: DataTypes.STRING,
        defaultValue: 'PENDING',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
    },
  );
  await queryInterface.addConstraint(
    { tableName: 'voucher', schema },
    {
      fields: ['product_variant_id'],
      type: 'foreign key',
      name: 'fk_voucher_product_variant',
      references: {
        table: { tableName: 'product_variant', schema },
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'voucher', schema });
};
