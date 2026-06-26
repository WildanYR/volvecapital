import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Coa } from './coa.model';
import { JournalTemplate } from './journal-template.model';

@Table({ tableName: 'journal_template_item', underscored: true })
export class JournalTemplateItem extends Model<JournalTemplateItem> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: string;

  @ForeignKey(() => JournalTemplate)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  declare journal_template_id: string;

  @ForeignKey(() => Coa)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare coa_id: string;

  @Column({
    type: DataType.ENUM('DEBIT', 'CREDIT'),
    allowNull: false,
  })
  declare position: 'DEBIT' | 'CREDIT';

  @BelongsTo(() => JournalTemplate)
  declare template: JournalTemplate;

  @BelongsTo(() => Coa)
  declare coa: Coa;
}
