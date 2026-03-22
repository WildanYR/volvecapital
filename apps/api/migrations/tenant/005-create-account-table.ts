import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'account', schema },
    {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.BIGINT,
      },
      account_password: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      subscription_expiry: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.STRING,
      },
      billing: {
        type: DataTypes.STRING,
      },
      batch_start_date: {
        type: DataTypes.DATE,
      },
      batch_end_date: {
        type: DataTypes.DATE,
      },
      email_id: {
        allowNull: false,
        type: DataTypes.BIGINT,
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
    { tableName: 'account', schema },
    {
      fields: ['email_id'],
      type: 'foreign key',
      name: 'fk_account_email',
      references: {
        table: { tableName: 'email', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'account', schema },
    {
      fields: ['product_variant_id'],
      type: 'foreign key',
      name: 'fk_account_product_variant',
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
  await queryInterface.dropTable({ tableName: 'account', schema });
};
