import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({
    tableName: 'tele_notifier',
    schema,
  });
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'tele_notifier', schema },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      chat_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      chat_thread_id: {
        type: DataTypes.BIGINT,
      },
      context: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      tenant_id: {
        type: DataTypes.STRING,
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

  await queryInterface.addConstraint(
    { tableName: 'tele_notifier', schema },
    {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_tenant_tele_notifier',
      references: {
        table: { tableName: 'tenant', schema },
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    },
  );
};
