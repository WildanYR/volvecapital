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
import { PlatformProduct } from './platform-product.model';
import { Transaction } from './transaction.model';

export interface ShopAttributes {
  id: string;
  name: string;
  platform: string;
  created_at: Date;
  updated_at: Date;
}

interface ShopCreationAttributes
  extends Optional<ShopAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({ tableName: 'shop' })
export class Shop extends Model<ShopAttributes, ShopCreationAttributes> {
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

  @HasMany(() => PlatformProduct)
  declare platform_products: PlatformProduct[];

  @HasMany(() => Transaction)
  declare transactions: Transaction[];

  @Column(DataType.DATE)
  declare created_at: Date;

  @Column(DataType.DATE)
  declare updated_at: Date;
}
