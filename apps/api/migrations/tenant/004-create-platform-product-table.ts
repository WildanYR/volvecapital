import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'platform_product', schema },
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
      platform: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      platform_product_id: {
        type: DataTypes.STRING,
      },
      product_variant_id: {
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
    { tableName: 'platform_product', schema },
    {
      fields: ['product_variant_id'],
      type: 'foreign key',
      name: 'fk_platform_product_product_variant',
      references: {
        table: { tableName: 'product_variant', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'platform_product', schema });
};
