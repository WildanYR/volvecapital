import { Optional } from 'sequelize';
import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { RolePermission } from './role-permission.model';

export interface PermissionAttributes {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, 'id' | 'created_at' | 'updated_at' | 'description'> {}

@Table({ tableName: 'permissions' })
export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string;

  @BelongsToMany(() => Role, () => RolePermission)
  declare roles: Role[];
}
