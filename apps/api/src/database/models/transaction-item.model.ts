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
import { AccountUser } from './account-user.model';
import { Transaction, TransactionAttributes } from './transaction.model';

export interface TransactionItemAttributes {
  id: string;
  name: string;
  transaction_id: string;
  account_user_id?: string;
  transaction: TransactionAttributes;
  user?: AccountUser;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionItemCreationAttributes
  extends Optional<
    TransactionItemAttributes,
    'id' | 'created_at' | 'updated_at' | 'transaction' | 'user'
  > {}

@Table({ tableName: 'transaction_item' })
export class TransactionItem extends Model<
  TransactionItemAttributes,
  TransactionItemCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @ForeignKey(() => Transaction)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare transaction_id: string;

  @ForeignKey(() => AccountUser)
  @Column(DataType.BIGINT)
  declare account_user_id?: string;

  @BelongsTo(() => Transaction, 'transaction_id')
  declare transaction: Transaction;

  @BelongsTo(() => AccountUser, 'account_user_id')
  declare user?: AccountUser;
}
