import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  // 1. Create roles table
  await queryInterface.createTable(
    { tableName: 'roles', schema },
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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

  // 2. Create permissions table
  await queryInterface.createTable(
    { tableName: 'permissions', schema },
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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

  // 3. Create role_permissions junction table
  await queryInterface.createTable(
    { tableName: 'role_permissions', schema },
    {
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      permission_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
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
    { tableName: 'role_permissions', schema },
    {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'fk_role_permissions_role',
      references: {
        table: { tableName: 'roles', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'role_permissions', schema },
    {
      fields: ['permission_id'],
      type: 'foreign key',
      name: 'fk_role_permissions_permission',
      references: {
        table: { tableName: 'permissions', schema },
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  // 4. Create dashboard_users table
  await queryInterface.createTable(
    { tableName: 'dashboard_users', schema },
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    { tableName: 'dashboard_users', schema },
    {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'fk_dashboard_users_role',
      references: {
        table: { tableName: 'roles', schema },
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
  );
};

export const down: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;
  await queryInterface.dropTable({ tableName: 'dashboard_users', schema });
  await queryInterface.dropTable({ tableName: 'role_permissions', schema });
  await queryInterface.dropTable({ tableName: 'permissions', schema });
  await queryInterface.dropTable({ tableName: 'roles', schema });
};
