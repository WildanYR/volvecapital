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
  items: TransactionItemAttributes[];
  created_at: Date;
  updated_at: Date;
}

interface TransactionCreationAttributes
  extends Optional<
    TransactionAttributes,
    'created_at' | 'updated_at' | 'items'
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

  @HasMany(() => TransactionItem)
  declare items: TransactionItem[];
}
