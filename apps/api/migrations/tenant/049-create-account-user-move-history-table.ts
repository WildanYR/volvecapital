import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.createTable(
    { schema, tableName: 'account_user_move_history' },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      account_user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: { tableName: 'account_user', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      from_account_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: { tableName: 'account', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      from_profile_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: { tableName: 'account_profile', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      to_account_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: { tableName: 'account', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      to_profile_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: { tableName: 'account_profile', schema },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
  );

  await queryInterface.addIndex({ schema, tableName: 'account_user_move_history' }, ['account_user_id']);
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  if (['public', 'master', 'information_schema', 'pg_catalog'].includes(schema)) return;

  await queryInterface.dropTable({ schema, tableName: 'account_user_move_history' });
};
