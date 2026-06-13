import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Account } from './account.model';
import { Label } from './label.model';

@Table({ tableName: 'account_label', timestamps: false })
export class AccountLabel extends Model {
  @ForeignKey(() => Account)
  @Column(DataType.BIGINT)
  declare account_id: string;

  @ForeignKey(() => Label)
  @Column(DataType.BIGINT)
  declare label_id: string;
}
