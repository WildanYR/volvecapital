import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface RevenueStatisticsAttributes {
  date: string;
  type: string;
  total_revenue: number;
  transaction_count: number;
  created_at: Date;
  updated_at: Date;
}

interface RevenueStatisticsCreationAttributes
  extends Optional<RevenueStatisticsAttributes, 'created_at' | 'updated_at'> {}

@Table({ tableName: 'revenue_statistics' })
export class RevenueStatistics extends Model<
  RevenueStatisticsAttributes,
  RevenueStatisticsCreationAttributes
> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare date: string;

  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare total_revenue: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare transaction_count: number;
}
