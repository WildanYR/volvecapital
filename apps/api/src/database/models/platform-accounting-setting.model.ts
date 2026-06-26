import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface PlatformAccountingSettingAttributes {
  id: string;
  platform: string;
  asset_coa_id: string;
  expense_coa_id: string;
  fee_type: string;
  fee_amount: number;
  created_at: Date;
  updated_at: Date;
}

interface PlatformAccountingSettingCreationAttributes
  extends Optional<
    PlatformAccountingSettingAttributes,
    'id' | 'created_at' | 'updated_at'
  > {}

@Table({ tableName: 'platform_accounting_setting' })
export class PlatformAccountingSetting extends Model<
  PlatformAccountingSettingAttributes,
  PlatformAccountingSettingCreationAttributes
> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  declare platform: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare asset_coa_id: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare expense_coa_id: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(20),
    defaultValue: 'FIXED',
  })
  declare fee_type: string;

  @AllowNull(false)
  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  declare fee_amount: number;

  @Column(DataType.DATE)
  declare created_at: Date;

  @Column(DataType.DATE)
  declare updated_at: Date;
}
