import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface ExpenseAttributes {
  id: string;
  amount: number;
  note: string;
  subject_id?: string;
  type: string;
  created_at: Date;
}

export interface ExpenseCreationAttributes
  extends Optional<
    ExpenseAttributes,
    'id' | 'created_at'
  > {}

@Table({ tableName: 'expense', timestamps: false })
export class Expense extends Model<
  ExpenseAttributes,
  ExpenseCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare amount: string;

  @Column(DataType.STRING)
  declare note: string;

  @Column(DataType.BIGINT)
  declare subject_id?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: string;

  @Column(DataType.DATE)
  declare created_at: Date;
}
