import { Optional } from 'sequelize';
import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Permission } from './permission.model';
import { RolePermission } from './role-permission.model';
import { DashboardUser } from './dashboard-user.model';

export interface RoleAttributes {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
  dashboard_users?: DashboardUser[];
  created_at: Date;
  updated_at: Date;
}

interface RoleCreationAttributes
  extends Optional<RoleAttributes, 'id' | 'created_at' | 'updated_at' | 'permissions' | 'dashboard_users' | 'description'> {}

@Table({ tableName: 'roles' })
export class Role extends Model<RoleAttributes, RoleCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string;

  @BelongsToMany(() => Permission, () => RolePermission)
  declare permissions: Permission[];

  @HasMany(() => DashboardUser)
  declare dashboard_users: DashboardUser[];
}
