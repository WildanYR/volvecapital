import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface TenantBankAccountAttributes {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_verified: boolean;
  otp_code: string | null;
  otp_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface TenantBankAccountCreationAttributes
  extends Optional<
    TenantBankAccountAttributes,
    'is_verified' | 'otp_code' | 'otp_expires' | 'created_at' | 'updated_at'
  > {}

@Table({ tableName: 'tenant_bank_account' })
export class TenantBankAccount extends Model<
  TenantBankAccountAttributes,
  TenantBankAccountCreationAttributes
> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  declare bank_name: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  declare account_number: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare account_holder: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare is_verified: boolean;

  @AllowNull(true)
  @Column(DataType.STRING(10))
  declare otp_code: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare otp_expires: Date | null;
}
