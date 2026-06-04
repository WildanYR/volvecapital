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
  Unique,
} from 'sequelize-typescript';
import { Role } from './role.model';

export interface DashboardUserAttributes {
  id: string;
  role_id: string;
  name: string;
  email: string;
  password: string;
  is_active: boolean;
  role?: Role;
  created_at: Date;
  updated_at: Date;
}

interface DashboardUserCreationAttributes
  extends Optional<DashboardUserAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at' | 'role'> {}

@Table({ tableName: 'dashboard_users' })
export class DashboardUser extends Model<DashboardUserAttributes, DashboardUserCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Role)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare role_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare password: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare is_active: boolean;

  @BelongsTo(() => Role, 'role_id')
  declare role: Role;
}
