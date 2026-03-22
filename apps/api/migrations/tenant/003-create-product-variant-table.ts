import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'product_variant', schema },
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.BIGINT,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      duration: {
        allowNull: false,
        type: DataTypes.BIGINT,
      },
      interval: {
        allowNull: false,
        type: DataTypes.BIGINT,
      },
      cooldown: {
        allowNull: false,
        type: DataTypes.BIGINT,
      },
      copy_template: {
        type: DataTypes.TEXT,
      },
      product_id: {
        allowNull: false,
        type: DataTypes.BIGINT,
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
    { tableName: 'product_variant', schema },
    {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'fk_product_variant_product',
      references: {
        table: { tableName: 'product', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'product_variant', schema });
};
