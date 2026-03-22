import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.createTable(
    { tableName: 'syslog', schema },
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      level: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      context: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      stack: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tenant_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: NOW,
      },
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'syslog', schema },
    {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_tenant_syslog',
      references: {
        table: { tableName: 'tenant', schema },
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }
  );

  // Index Use Case 1 & 2: Cari berdasar Tenant + Level
  await queryInterface.addIndex(
    { tableName: 'syslog', schema },
    {
      fields: ['tenant_id', 'level', { name: 'created_at', order: 'DESC' }],
      name: 'idx_logs_tenant_level_time',
    },
  );

  // Index Use Case 3: Cari berdasar Tenant + Context
  await queryInterface.addIndex(
    { tableName: 'syslog', schema },
    {
      fields: ['tenant_id', 'context', { name: 'created_at', order: 'DESC' }],
      name: 'idx_logs_tenant_context_time',
    }
  );

  // Index Use Case 4: Untuk mempercepat Cron Job "TTL"
  await queryInterface.addIndex(
    { tableName: 'syslog', schema },
    ['created_at'],
    { name: 'idx_logs_created_at' }
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'syslog', schema });
};
