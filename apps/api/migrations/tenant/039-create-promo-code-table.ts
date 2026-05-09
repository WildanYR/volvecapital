import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'promo_code', schema },
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      code: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM('FIXED', 'PERCENTAGE'),
      },
      value: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 2),
      },
      max_usage: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      current_usage: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      min_purchase: {
        allowNull: false,
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      start_date: {
        type: DataTypes.DATE,
      },
      end_date: {
        type: DataTypes.DATE,
      },
      is_active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
    },
  );

  await queryInterface.addIndex(
    { tableName: 'promo_code', schema },
    ['code'],
    { unique: true }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'promo_code', schema });
};
