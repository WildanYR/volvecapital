import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { Permission } from './permission.model';

@Table({ tableName: 'role_permissions' })
export class RolePermission extends Model {
  @ForeignKey(() => Role)
  @Column(DataType.UUID)
  declare role_id: string;

  @ForeignKey(() => Permission)
  @Column(DataType.UUID)
  declare permission_id: string;
}
