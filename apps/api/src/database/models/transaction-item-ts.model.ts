import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AccountUser, AccountUserAttributes } from './account-user.model';
import { Account, AccountAttributes } from './account.model';
import { ProductVariant, ProductVariantAttributes } from './product-variant.model';
import { Product, ProductAttributes } from './product.model';
import { TransactionTS, TransactionTSAttributes } from './transaction-ts.model';

export interface TransactionItemTSAttributes {
  id: string;
  price: string;
  transaction_id: string;
  account_id?: string;
  account_user_id?: string;
  product_id?: string;
  product_variant_id?: string;
  transaction: TransactionTSAttributes;
  account?: AccountAttributes;
  user?: AccountUserAttributes;
  product?: ProductAttributes;
  product_variant?: ProductVariantAttributes;
  created_at: Date;
}

export interface TransactionItemTSCreationAttributes
  extends Optional<
    TransactionItemTSAttributes,
    'id' | 'created_at' | 'transaction' | 'account' | 'user' | 'product' | 'product_variant'
  > {}

@Table({ tableName: 'transaction_item_ts', timestamps: false })
export class TransactionItemTS extends Model<
  TransactionItemTSAttributes,
  TransactionItemTSCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare price: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare transaction_id: string;

  @Column(DataType.BIGINT)
  declare account_id?: string;

  @Column(DataType.BIGINT)
  declare account_user_id?: string;

  @Column(DataType.BIGINT)
  declare product_id?: string;

  @Column(DataType.BIGINT)
  declare product_variant_id?: string;

  @Column(DataType.DATE)
  declare created_at: Date;

  @BelongsTo(() => TransactionTS, { foreignKey: 'transaction_id', constraints: false })
  declare transaction: TransactionTS;

  @BelongsTo(() => Account, { foreignKey: 'account_id', constraints: false })
  declare account?: Account;

  @BelongsTo(() => AccountUser, { foreignKey: 'account_user_id', constraints: false })
  declare user?: AccountUser;

  @BelongsTo(() => Product, { foreignKey: 'product_id', constraints: false })
  declare product?: Product;

  @BelongsTo(() => ProductVariant, { foreignKey: 'product_variant_id', constraints: false })
  declare product_variant?: ProductVariant;
}
