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
import { Tenant } from './tenant.model';

export interface TenantOwnerAttributes {
  id: string;
  tenant_id: string;
  email: string;
  password: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface TenantOwnerCreationAttributes
  extends Optional<TenantOwnerAttributes, 'id' | 'created_at' | 'updated_at' | 'is_verified'> {}

@Table({ tableName: 'tenant_owner' })
export class TenantOwner extends Model<TenantOwnerAttributes, TenantOwnerCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Tenant)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare tenant_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare password: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare is_verified: boolean;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;
}
