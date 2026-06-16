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

export interface UserShiftAttributes {
  id: string;
  user_id: string;
  shift_id: string;
  effective_date: string;
  is_default: boolean;
  user?: DashboardUser;
  shift?: Shift;
  created_at: Date;
  updated_at: Date;
}

interface UserShiftCreationAttributes
  extends Optional<UserShiftAttributes, 'id' | 'is_default' | 'created_at' | 'updated_at' | 'user' | 'shift'> {}

@Table({ tableName: 'user_shifts' })
export class UserShift extends Model<UserShiftAttributes, UserShiftCreationAttributes> {
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
  @AllowNull(false)
  @Column(DataType.UUID)
  declare shift_id: string;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare effective_date: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare is_default: boolean;

  @BelongsTo(() => DashboardUser, 'user_id')
  declare user: DashboardUser;

  @BelongsTo(() => Shift, 'shift_id')
  declare shift: Shift;
}
