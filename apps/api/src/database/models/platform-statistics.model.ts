import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface PlatformStatisticsAttributes {
  date: string;
  type: string;
  platform: string;
  transaction_count: number;
  created_at: Date;
  updated_at: Date;
}

interface PlatformStatisticsCreationAttributes
  extends Optional<PlatformStatisticsAttributes, 'created_at' | 'updated_at'> {}

@Table({ tableName: 'platform_statistics' })
export class PlatformStatistics extends Model<
  PlatformStatisticsAttributes,
  PlatformStatisticsCreationAttributes
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
  @Column(DataType.STRING)
  declare platform: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare transaction_count: number;
}
