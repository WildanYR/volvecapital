import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  await queryInterface.createTable(
    { tableName: 'withdrawal_request', schema },
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING, // Using UUID or Snowflake ID (String)
      },
      amount: {
        allowNull: false,
        type: DataTypes.INTEGER, // Match total_price
      },
      admin_fee: {
        allowNull: false,
        type: DataTypes.INTEGER, // Default DOKU transfer fee
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'PROCESSING', 'SUCCESS', 'FAILED'),
        defaultValue: 'PENDING',
      },
      bank_info: {
        allowNull: false,
        type: DataTypes.JSON,
      },
      doku_reference: {
        allowNull: true,
        type: DataTypes.STRING, // Can be null until processed
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
    }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'withdrawal_request', schema });
};
