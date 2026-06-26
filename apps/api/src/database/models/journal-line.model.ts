import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Coa } from './coa.model';
import { JournalEntry } from './journal-entry.model';

@Table({ tableName: 'journal_line', underscored: true })
export class JournalLine extends Model<JournalLine> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: string;

  @ForeignKey(() => JournalEntry)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  declare journal_entry_id: string;

  @BelongsTo(() => JournalEntry)
  declare journal_entry: JournalEntry;

  @ForeignKey(() => Coa)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  declare coa_id: string;

  @BelongsTo(() => Coa)
  declare coa: Coa;

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare debit: number;

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare credit: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare memo?: string | null;
}
