import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({ tableName: 'tenant_setting' })
export class TenantSetting extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare key: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare value: string;
}
