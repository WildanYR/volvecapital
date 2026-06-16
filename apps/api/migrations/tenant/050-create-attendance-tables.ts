import type { MigrationContext } from 'migrations/migrator';
import type { MigrationFn } from 'umzug';
import { DataTypes, NOW } from 'sequelize';

export const up: MigrationFn<MigrationContext> = async ({ context }) => {
  const { queryInterface, schema } = context;

  // 1. Create shifts table
  await queryInterface.createTable(
    { tableName: 'shifts', schema },
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
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Asia/Jakarta',
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

  // 2. Create user_shifts table
  await queryInterface.createTable(
    { tableName: 'user_shifts', schema },
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
      shift_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      effective_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      is_default: {
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
    { tableName: 'user_shifts', schema },
    {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_user_shifts_user',
      references: { table: { tableName: 'dashboard_users', schema }, field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'user_shifts', schema },
    {
      fields: ['shift_id'],
      type: 'foreign key',
      name: 'fk_user_shifts_shift',
      references: { table: { tableName: 'shifts', schema }, field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  // 3. Create attendances table
  await queryInterface.createTable(
    { tableName: 'attendances', schema },
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
      shift_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'not_started',
      },
      late_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      early_leave_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_work_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      work_summary: {
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

  await queryInterface.addConstraint(
    { tableName: 'attendances', schema },
    {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_attendances_user',
      references: { table: { tableName: 'dashboard_users', schema }, field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'attendances', schema },
    {
      fields: ['shift_id'],
      type: 'foreign key',
      name: 'fk_attendances_shift',
      references: { table: { tableName: 'shifts', schema }, field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  );

  // 4. Create weekly_off_schedules table
  await queryInterface.createTable(
    { tableName: 'weekly_off_schedules', schema },
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
      off_day: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
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

  await queryInterface.addConstraint(
    { tableName: 'weekly_off_schedules', schema },
    {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_weekly_off_schedules_user',
      references: { table: { tableName: 'dashboard_users', schema }, field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'weekly_off_schedules', schema },
    {
      fields: ['approved_by'],
      type: 'foreign key',
      name: 'fk_weekly_off_schedules_approver',
      references: { table: { tableName: 'dashboard_users', schema }, field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  );

  // 5. Create weekly_off_requests table
  await queryInterface.createTable(
    { tableName: 'weekly_off_requests', schema },
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
      current_off_day: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requested_off_day: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending', // pending, approved, rejected
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      note: {
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

  await queryInterface.addConstraint(
    { tableName: 'weekly_off_requests', schema },
    {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_weekly_off_requests_user',
      references: { table: { tableName: 'dashboard_users', schema }, field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );

  await queryInterface.addConstraint(
    { tableName: 'weekly_off_requests', schema },
    {
      fields: ['approved_by'],
      type: 'foreign key',
      name: 'fk_weekly_off_requests_approver',
      references: { table: { tableName: 'dashboard_users', schema }, field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  );

  // 6. Create attendance_settings table
  await queryInterface.createTable(
    { tableName: 'attendance_settings', schema },
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      late_tolerance_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      max_off_per_day: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
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

  await queryInterface.dropTable({ tableName: 'attendance_settings', schema });
  await queryInterface.dropTable({ tableName: 'weekly_off_requests', schema });
  await queryInterface.dropTable({ tableName: 'weekly_off_schedules', schema });
  await queryInterface.dropTable({ tableName: 'attendances', schema });
  await queryInterface.dropTable({ tableName: 'user_shifts', schema });
  await queryInterface.dropTable({ tableName: 'shifts', schema });
};
