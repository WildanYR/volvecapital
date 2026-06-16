import { Optional } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { DashboardUser } from './dashboard-user.model';
import { Shift } from './shift.model';

export interface AttendanceAttributes {
  id: string;
  user_id: string;
  shift_id?: string | null;
  attendance_date: string;
  start_time?: Date | null;
  end_time?: Date | null;
  status: string; // not_started, working, completed, late, early_leave, late_and_early_leave, missing_checkout, absent, weekly_off
  late_minutes: number;
  early_leave_minutes: number;
  total_work_minutes: number;
  work_summary?: string | null;
  user?: DashboardUser;
  shift?: Shift;
  created_at: Date;
  updated_at: Date;
}

interface AttendanceCreationAttributes
  extends Optional<AttendanceAttributes, 'id' | 'shift_id' | 'start_time' | 'end_time' | 'status' | 'late_minutes' | 'early_leave_minutes' | 'total_work_minutes' | 'work_summary' | 'created_at' | 'updated_at' | 'user' | 'shift'> {}

@Table({ tableName: 'attendances' })
export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => DashboardUser)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare user_id: string;

  @ForeignKey(() => Shift)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare shift_id: string;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare attendance_date: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare start_time: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare end_time: Date;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    defaultValue: 'not_started',
  })
  declare status: string;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare late_minutes: number;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare early_leave_minutes: number;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare total_work_minutes: number;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare work_summary: string;

  @BelongsTo(() => DashboardUser, 'user_id')
  declare user: DashboardUser;

  @BelongsTo(() => Shift, 'shift_id')
  declare shift: Shift;
}
