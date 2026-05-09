import { Optional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ProductVariant } from './product-variant.model';

export interface PromoCodeAttributes {
  id: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  max_usage: number;
  current_usage: number;
  min_purchase: number;
  start_date: Date | string | null;
  end_date: Date | string | null;
  is_active: boolean;
  product_variant_id: string | null;
}

export type PromoCodeCreationAttributes = Optional<
  PromoCodeAttributes,
  'id' | 'current_usage' | 'is_active' | 'product_variant_id'
>;

@Table({
  tableName: 'promo_code',
  underscored: true,
  timestamps: true,
})
export class PromoCode extends Model<PromoCodeAttributes, PromoCodeCreationAttributes> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.ENUM('FIXED', 'PERCENTAGE'),
  })
  declare type: 'FIXED' | 'PERCENTAGE';

  @Column({
    allowNull: false,
    type: DataType.DECIMAL(10, 2),
    get() {
      return Number(this.getDataValue('value'));
    },
  })
  declare value: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare max_usage: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare current_usage: number;

  @Column({
    allowNull: false,
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0,
    get() {
      return Number(this.getDataValue('min_purchase'));
    },
  })
  declare min_purchase: number;

  @Column({
    type: DataType.DATE,
  })
  declare start_date: Date | string | null;

  @Column({
    type: DataType.DATE,
  })
  declare end_date: Date | string | null;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare is_active: boolean;

  @ForeignKey(() => ProductVariant)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare product_variant_id: string | null;

  @BelongsTo(() => ProductVariant)
  declare product_variant: ProductVariant;
}
