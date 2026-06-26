import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'accounting_period', underscored: true })
export class AccountingPeriod extends Model<AccountingPeriod> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare period_name: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare start_date: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare end_date: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_closed: boolean;
}
