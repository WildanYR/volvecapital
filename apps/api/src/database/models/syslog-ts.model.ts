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
import { Tenant } from './tenant.model';

export interface SyslogTSAttributes {
  id: string;
  level: string;
  context: string;
  message: string;
  stack?: string | null;
  tenant_id?: string | null;
  created_at: Date;
}

interface SyslogTSCreationAttributes
  extends Optional<
    SyslogTSAttributes,
    'id' | 'created_at'
  > {}

@Table({ tableName: 'syslog_ts', timestamps: false })
export class SyslogTS extends Model<SyslogTSAttributes, SyslogTSCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare level: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare context: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare message: string;

  @Column(DataType.TEXT)
  declare stack?: string;

  @ForeignKey(() => Tenant)
  @Column(DataType.STRING)
  declare tenant_id?: string;

  @Column(DataType.DATE)
  declare created_at: Date;

  @BelongsTo(() => Tenant, 'tenant_id')
  declare tenant?: Tenant;
}
