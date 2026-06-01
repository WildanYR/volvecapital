import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import {
  TransactionItem,
  TransactionItemAttributes,
} from './transaction-item.model';

export interface TransactionAttributes {
  id: string;
  customer: string;
  platform: string;
  total_price: number;
  mdr_fee: number;
  platform_fee: number;
  net_profit: number;
  items: TransactionItemAttributes[];
  created_at: Date;
  updated_at: Date;
}

interface TransactionCreationAttributes
  extends Optional<
    TransactionAttributes,
    'created_at' | 'updated_at' | 'items' | 'mdr_fee' | 'platform_fee' | 'net_profit'
  > {}

@Table({ tableName: 'transaction' })
export class Transaction extends Model<
  TransactionAttributes,
  TransactionCreationAttributes
> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare customer: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare platform: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare total_price: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare mdr_fee: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare platform_fee: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare net_profit: number;

  @HasMany(() => TransactionItem)
  declare items: TransactionItem[];

  @Column(DataType.DATE)
  declare created_at: Date;

  @Column(DataType.DATE)
  declare updated_at: Date;
}
