import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { JournalLine } from './journal-line.model';

@Table({ tableName: 'coa', underscored: true })
export class Coa extends Model<Coa> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  declare code: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(30),
    allowNull: false,
  })
  declare type: string; // ASET, KEWAJIBAN, MODAL, PENDAPATAN, HPP, BEBAN

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  declare normal_balance: string; // DEBIT, KREDIT

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare is_active: boolean;

  @ForeignKey(() => Coa)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare parent_id: string;

  @BelongsTo(() => Coa)
  declare parent: Coa;

  @HasMany(() => Coa)
  declare children: Coa[];

  @HasMany(() => JournalLine)
  declare journal_lines: JournalLine[];
}
