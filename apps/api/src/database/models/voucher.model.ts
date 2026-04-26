import { Optional } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { ProductVariant, ProductVariantAttributes } from './product-variant.model';
import { Transaction, TransactionAttributes } from './transaction.model';
import { TransactionItem } from './transaction-item.model';

export type VoucherStatus = 'UNUSED' | 'USED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface VoucherAttributes {
  id: string;
  product_variant_id: string;
  status: VoucherStatus;
  buyer_name: string;
  buyer_email: string;
  buyer_whatsapp: string;
  expired_at: Date;
  transaction_id?: string | null;
  transaction_item_id?: string | null;
  payment_id?: string | null;
  payment_status: PaymentStatus;
  product_variant?: ProductVariantAttributes;
  transaction?: TransactionAttributes;
  used_at?: Date | null;
  access_token?: string | null;
  access_count_today: number;
  last_access_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface VoucherCreationAttributes
  extends Optional<
    VoucherAttributes,
    | 'status'
    | 'payment_status'
    | 'access_token'
    | 'access_count_today'
    | 'last_access_at'
    | 'transaction_id'
    | 'transaction_item_id'
    | 'payment_id'
    | 'product_variant'
    | 'transaction'
    | 'used_at'
    | 'created_at'
    | 'updated_at'
  > {}

@Table({ tableName: 'voucher' })
export class Voucher extends Model<VoucherAttributes, VoucherCreationAttributes> {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @ForeignKey(() => ProductVariant)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare product_variant_id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare status: VoucherStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare buyer_name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare buyer_email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare buyer_whatsapp: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expired_at: Date;

  @ForeignKey(() => Transaction)
  @Column(DataType.STRING)
  declare transaction_id?: string | null;

  @ForeignKey(() => TransactionItem)
  @Column(DataType.BIGINT)
  declare transaction_item_id?: string | null;

  @Column(DataType.STRING)
  declare payment_id?: string | null;

  @Column(DataType.DATE)
  declare used_at?: Date | null;

  @Column(DataType.STRING)
  declare access_token?: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare access_count_today: number;

  @Column(DataType.DATE)
  declare last_access_at?: Date | null;

  @Column(DataType.STRING)
  declare payment_status: PaymentStatus;

  @BelongsTo(() => ProductVariant, 'product_variant_id')
  declare product_variant?: ProductVariant;

  @BelongsTo(() => Transaction, 'transaction_id')
  declare transaction?: Transaction;

  @BelongsTo(() => TransactionItem, 'transaction_item_id')
  declare transaction_item?: TransactionItem;
}
