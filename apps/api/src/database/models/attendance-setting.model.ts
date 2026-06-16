import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface AttendanceSettingAttributes {
  id: string;
  late_tolerance_minutes: number;
  max_off_per_day: number;
  created_at: Date;
  updated_at: Date;
}

interface AttendanceSettingCreationAttributes
  extends Optional<AttendanceSettingAttributes, 'id' | 'late_tolerance_minutes' | 'max_off_per_day' | 'created_at' | 'updated_at'> {}

@Table({ tableName: 'attendance_settings' })
export class AttendanceSetting extends Model<AttendanceSettingAttributes, AttendanceSettingCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 10,
  })
  declare late_tolerance_minutes: number;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare max_off_per_day: number;
}
