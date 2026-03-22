import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'task_queue', schema },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      execute_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      subject_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      context: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      payload: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
      },
      error_message: {
        type: DataTypes.STRING,
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
    { tableName: 'task_queue', schema },
    {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_tenant_task_queue',
      references: {
        table: { tableName: 'tenant', schema },
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'task_queue', schema });
};
