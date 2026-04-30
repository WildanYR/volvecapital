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
  name: string | null;
  status: 'active' | 'pending' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

interface TenantCreationAttributes
  extends Optional<TenantAttributes, 'created_at' | 'updated_at' | 'status' | 'name'> {}

@Table({ tableName: 'tenant' })
export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare name: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('active', 'pending', 'suspended'),
    defaultValue: 'pending',
  })
  declare status: 'active' | 'pending' | 'suspended';
}

