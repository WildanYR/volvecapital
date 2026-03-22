import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import {
  ProductVariant,
  ProductVariantAttributes,
} from './product-variant.model';

export interface ProductAttributes {
  id: string;
  name: string;
  variants?: ProductVariantAttributes[];
  created_at: Date;
  updated_at: Date;
}

interface ProductCreationAttributes
  extends Optional<
    ProductAttributes,
    'id' | 'created_at' | 'updated_at' | 'variants'
  > {}

@Table({ tableName: 'product' })
export class Product extends Model<
  ProductAttributes,
  ProductCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @HasMany(() => ProductVariant)
  declare variants?: ProductVariant[];
}
