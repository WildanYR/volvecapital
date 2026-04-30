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
  reset_token?: string | null;
  reset_expires?: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface TenantOwnerCreationAttributes
  extends Optional<TenantOwnerAttributes, 'id' | 'is_verified' | 'created_at' | 'updated_at' | 'reset_token' | 'reset_expires'> {}

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

  @AllowNull(true)
  @Column(DataType.STRING)
  declare reset_token: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare reset_expires: Date | null;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;
}
