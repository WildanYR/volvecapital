import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface TenantAttributes {
  id: string;
  secret: string;
  created_at: Date;
  updated_at: Date;
}

interface TenantCreationAttributes
  extends Optional<TenantAttributes, 'created_at' | 'updated_at'> {}

@Table({ tableName: 'tenant' })
export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare secret: string;
}
