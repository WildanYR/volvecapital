import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'transaction_item', schema },
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
      transaction_id: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      account_user_id: {
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
    { tableName: 'transaction_item', schema },
    {
      fields: ['transaction_id'],
      type: 'foreign key',
      name: 'fk_transaction_item_transaction',
      references: {
        table: { tableName: 'transaction', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'transaction_item', schema },
    {
      fields: ['account_user_id'],
      type: 'foreign key',
      name: 'fk_transaction_item_account_user',
      references: {
        table: { tableName: 'account_user', schema },
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'transaction_item', schema });
};
