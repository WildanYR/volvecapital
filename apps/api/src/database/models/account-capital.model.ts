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
import { Account } from './account.model';

export interface AccountCapitalAttributes {
  id: string;
  account_id: string;
  amount: number;
  note?: string;
  payment_coa_id?: string;
  expense_coa_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AccountCapitalCreationAttributes
  extends Optional<AccountCapitalAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({ tableName: 'account_capital' })
export class AccountCapital extends Model<AccountCapitalAttributes, AccountCapitalCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @ForeignKey(() => Account)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare account_id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare amount: number;

  @Column(DataType.TEXT)
  declare note: string;

  @Column(DataType.STRING)
  declare payment_coa_id: string;

  @Column(DataType.STRING)
  declare expense_coa_id: string;

  @BelongsTo(() => Account)
  declare account: Account;
}
