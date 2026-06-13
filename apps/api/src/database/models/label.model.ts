import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Account, AccountAttributes } from './account.model';
import { AccountLabel } from './account-label.model';
import { ProductVariant, ProductVariantAttributes } from './product-variant.model';

export interface LabelAttributes {
  id: string;
  name: string;
  color?: string;
  product_variant_id: string;
  product_variant?: ProductVariantAttributes;
  accounts?: AccountAttributes[];
  created_at: Date;
  updated_at: Date;
}

interface LabelCreationAttributes
  extends Optional<LabelAttributes, 'id' | 'color' | 'created_at' | 'updated_at'> {}

@Table({ tableName: 'label' })
export class Label extends Model<LabelAttributes, LabelCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare color?: string;

  @ForeignKey(() => ProductVariant)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare product_variant_id: string;

  @BelongsTo(() => ProductVariant, 'product_variant_id')
  declare product_variant: ProductVariant;

  @BelongsToMany(() => Account, () => AccountLabel)
  declare accounts?: Account[];
}
