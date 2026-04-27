import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Account, AccountAttributes } from './account.model';
import {
  PlatformProduct,
  PlatformProductAttributes,
} from './platform-product.model';
import { Product, ProductAttributes } from './product.model';

export interface ProductVariantAttributes {
  id: string;
  name: string;
  duration: number;
  interval: number;
  cooldown: number;
  price: number;
  description?: string;
  copy_template?: string;
  voucher_expiry_hours?: number;
  product_id: string;
  product: ProductAttributes;
  platform_product?: PlatformProductAttributes[];
  account?: AccountAttributes[];
  created_at: Date;
  updated_at: Date;
  redeem_display_config?: any;
}

interface ProductVariantCreationAttributes
  extends Optional<
    ProductVariantAttributes,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'product'
    | 'platform_product'
    | 'account'
  > {}

@Table({ tableName: 'product_variant' })
export class ProductVariant extends Model<
  ProductVariantAttributes,
  ProductVariantCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare duration: number;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare interval: number;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare cooldown: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare price: number;

  @Column(DataType.TEXT)
  declare description?: string;

  @Column(DataType.TEXT)
  declare copy_template?: string;

  @Column(DataType.INTEGER)
  declare voucher_expiry_hours?: number;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare product_id: string;

  @BelongsTo(() => Product, 'product_id')
  declare product: Product;

  @HasMany(() => PlatformProduct)
  declare platform_product?: PlatformProduct[];

  @HasMany(() => Account)
  declare account?: Account[];

  @Column(DataType.JSONB)
  declare redeem_display_config?: any;
}
