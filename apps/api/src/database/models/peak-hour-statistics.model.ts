import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface PeakHourStatisticsAttributes {
  date: string;
  type: string;
  hour: number;
  transaction_count: number;
  created_at: Date;
  updated_at: Date;
}

interface PeakHourStatisticsCreationAttributes
  extends Optional<PeakHourStatisticsAttributes, 'created_at' | 'updated_at'> {}

@Table({ tableName: 'peak_hour_statistics' })
export class PeakHourStatistics extends Model<
  PeakHourStatisticsAttributes,
  PeakHourStatisticsCreationAttributes
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
  @Column(DataType.INTEGER)
  declare hour: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare transaction_count: number;
}
