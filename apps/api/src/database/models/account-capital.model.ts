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
  created_at: Date;
  updated_at: Date;
}

@Table({ tableName: 'account_capital' })
export class AccountCapital extends Model<AccountCapitalAttributes> {
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

  @BelongsTo(() => Account)
  declare account: Account;
}
