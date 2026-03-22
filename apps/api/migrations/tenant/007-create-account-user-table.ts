import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'account_user', schema },
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
      status: {
        type: DataTypes.STRING,
      },
      account_id: {
        allowNull: false,
        type: DataTypes.BIGINT,
      },
      account_profile_id: {
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
    { tableName: 'account_user', schema },
    {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_account_user_account',
      references: {
        table: { tableName: 'account', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'account_user', schema },
    {
      fields: ['account_profile_id'],
      type: 'foreign key',
      name: 'fk_account_user_account_profile',
      references: {
        table: { tableName: 'account_profile', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'account_user', schema });
};
