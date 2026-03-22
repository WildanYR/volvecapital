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
import {
  ProductVariant,
  ProductVariantAttributes,
} from './product-variant.model';

export interface PlatformProductAttributes {
  id: string;
  name: string;
  platform: string;
  platform_product_id?: string;
  product_variant_id: string;
  product_variant: ProductVariantAttributes;
  created_at: Date;
  updated_at: Date;
}

interface PlatformProductCreationAttributes
  extends Optional<
    PlatformProductAttributes,
    'id' | 'created_at' | 'updated_at' | 'product_variant'
  > {}

@Table({ tableName: 'platform_product' })
export class PlatformProduct extends Model<
  PlatformProductAttributes,
  PlatformProductCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare platform: string;

  @Column(DataType.STRING)
  declare platform_product_id?: string;

  @ForeignKey(() => ProductVariant)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare product_variant_id: string;

  @BelongsTo(() => ProductVariant, 'product_variant_id')
  declare product_variant: ProductVariant;
}
