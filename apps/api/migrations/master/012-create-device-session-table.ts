import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'device_session', schema },
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      tenant_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      device_info: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ip_address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_active_at: {
        type: DataTypes.DATE,
        defaultValue: NOW,
        allowNull: false,
      },
      is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'device_session', schema });
};
