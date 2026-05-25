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
import { TransactionItemTS, TransactionItemTSAttributes } from './transaction-item-ts.model';

export interface TransactionTSAttributes {
  id: string;
  customer: string;
  platform: string;
  total_price: number;
  items: TransactionItemTSAttributes[];
  created_at: Date;
}

interface TransactionTSCreationAttributes
  extends Optional<
    TransactionTSAttributes,
    'created_at' | 'items'
  > {}

@Table({ tableName: 'transaction_ts', timestamps: false })
export class TransactionTS extends Model<
  TransactionTSAttributes,
  TransactionTSCreationAttributes
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

  @Column(DataType.DATE)
  declare created_at: Date;

  @HasMany(() => TransactionItemTS, { foreignKey: 'transaction_id', constraints: false })
  declare items: TransactionItemTS[];
}
