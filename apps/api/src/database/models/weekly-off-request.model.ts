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

export interface WeeklyOffRequestAttributes {
  id: string;
  user_id: string;
  current_off_day?: string | null;
  requested_off_day: string;
  status: string; // pending, approved, rejected
  approved_by?: string | null;
  approved_at?: Date | null;
  note?: string | null;
  user?: DashboardUser;
  approver?: DashboardUser;
  created_at: Date;
  updated_at: Date;
}

interface WeeklyOffRequestCreationAttributes
  extends Optional<WeeklyOffRequestAttributes, 'id' | 'current_off_day' | 'status' | 'approved_by' | 'approved_at' | 'note' | 'created_at' | 'updated_at' | 'user' | 'approver'> {}

@Table({ tableName: 'weekly_off_requests' })
export class WeeklyOffRequest extends Model<WeeklyOffRequestAttributes, WeeklyOffRequestCreationAttributes> {
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

  @AllowNull(true)
  @Column(DataType.STRING)
  declare current_off_day: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare requested_off_day: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    defaultValue: 'pending',
  })
  declare status: string;

  @ForeignKey(() => DashboardUser)
  @AllowNull(true)
  @Column(DataType.UUID)
  declare approved_by: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare approved_at: Date;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare note: string;

  @BelongsTo(() => DashboardUser, 'user_id')
  declare user: DashboardUser;

  @BelongsTo(() => DashboardUser, 'approved_by')
  declare approver: DashboardUser;
}
