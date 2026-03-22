import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Tenant, TenantAttributes } from './tenant.model';

export interface TeleNotifierAttributes {
  id: string;
  chat_id: number;
  chat_thread_id?: number;
  context: string;
  isEnabled: boolean;
  tenant_id: string;
  tenant: TenantAttributes;
  created_at: Date;
  updated_at: Date;
}

interface TeleNotifierCreationAttributes
  extends Optional<
    TeleNotifierAttributes,
    'id' | 'created_at' | 'updated_at' | 'tenant'
  > {}

@Table({ tableName: 'tele_notifier' })
export class TeleNotifier extends Model<
  TeleNotifierAttributes,
  TeleNotifierCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare chat_id: number;

  @Column(DataType.BIGINT)
  declare chat_thread_id?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare context: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare isEnabled: boolean;

  @ForeignKey(() => Tenant)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare tenant_id: string;

  @BelongsTo(() => Tenant, 'tenant_id')
  declare tenant: Tenant;
}
