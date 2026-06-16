import { Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface ShiftAttributes {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ShiftCreationAttributes
  extends Optional<ShiftAttributes, 'id' | 'timezone' | 'is_active' | 'created_at' | 'updated_at'> {}

@Table({ tableName: 'shifts' })
export class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> {
  @PrimaryKey
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.TIME)
  declare start_time: string;

  @AllowNull(false)
  @Column(DataType.TIME)
  declare end_time: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    defaultValue: 'Asia/Jakarta',
  })
  declare timezone: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare is_active: boolean;
}
