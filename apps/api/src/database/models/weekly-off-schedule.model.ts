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

export interface WeeklyOffScheduleAttributes {
  id: string;
  user_id: string;
  off_day: string; // e.g., 'Monday', 'Tuesday'
  is_active: boolean;
  approved_by?: string | null;
  approved_at?: Date | null;
  user?: DashboardUser;
  approver?: DashboardUser;
  created_at: Date;
  updated_at: Date;
}

interface WeeklyOffScheduleCreationAttributes
  extends Optional<WeeklyOffScheduleAttributes, 'id' | 'is_active' | 'approved_by' | 'approved_at' | 'created_at' | 'updated_at' | 'user' | 'approver'> {}

@Table({ tableName: 'weekly_off_schedules' })
export class WeeklyOffSchedule extends Model<WeeklyOffScheduleAttributes, WeeklyOffScheduleCreationAttributes> {
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

  @AllowNull(false)
  @Column(DataType.STRING)
  declare off_day: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare is_active: boolean;

  @ForeignKey(() => DashboardUser)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare approved_by: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare approved_at: Date;

  @BelongsTo(() => DashboardUser, 'user_id')
  declare user: DashboardUser;

  @BelongsTo(() => DashboardUser, 'approved_by')
  declare approver: DashboardUser;
}
