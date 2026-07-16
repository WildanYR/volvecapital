import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { JournalLine } from './journal-line.model';

@Table({ tableName: 'journal_entry', underscored: true })
export class JournalEntry extends Model<JournalEntry> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'date',
  })
  declare transaction_date: Date;


  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'reference',
  })
  declare reference_number: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'POSTED',
  })
  declare status: string; // DRAFT, POSTED, VOID

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'MANUAL',
  })
  declare source: string; // AUTO_LANDING, AUTO_SHOPEE, MANUAL, ADJUSTMENT, CLOSING

  @HasMany(() => JournalLine)
  declare lines: JournalLine[];
}
