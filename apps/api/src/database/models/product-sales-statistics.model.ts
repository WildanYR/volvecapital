import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface ProductSalesStatisticsAttributes {
  date: string;
  type: string;
  product_variant_id: string;
  items_sold: number;
  created_at: Date;
  updated_at: Date;
}

interface ProductSalesStatisticsCreationAttributes
  extends Optional<
    ProductSalesStatisticsAttributes,
    'created_at' | 'updated_at'
  > {}

@Table({ tableName: 'product_sales_statistics' })
export class ProductSalesStatistics extends Model<
  ProductSalesStatisticsAttributes,
  ProductSalesStatisticsCreationAttributes
> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare date: string;

  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: string;

  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare product_variant_id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare items_sold: number;
}
