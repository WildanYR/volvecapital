import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface WithdrawalRequestAttributes {
  id: string;
  amount: number;
  admin_fee: number;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  bank_info: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    email?: string;
  };
  doku_reference: string | null;
  created_at: Date;
  updated_at: Date;
}

interface WithdrawalRequestCreationAttributes
  extends Optional<
    WithdrawalRequestAttributes,
    'status' | 'doku_reference' | 'created_at' | 'updated_at'
  > {}

@Table({ tableName: 'withdrawal_request' })
export class WithdrawalRequest extends Model<
  WithdrawalRequestAttributes,
  WithdrawalRequestCreationAttributes
> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare amount: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare admin_fee: number;

  @AllowNull(false)
  @Column(DataType.ENUM('PENDING', 'APPROVED', 'PROCESSING', 'SUCCESS', 'FAILED'))
  declare status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

  @AllowNull(false)
  @Column(DataType.JSON)
  declare bank_info: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    email?: string;
  };

  @AllowNull(true)
  @Column(DataType.STRING)
  declare doku_reference: string | null;
}
