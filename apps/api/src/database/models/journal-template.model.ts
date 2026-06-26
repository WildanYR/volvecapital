import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { JournalTemplateItem } from './journal-template-item.model';

@Table({ tableName: 'journal_template', underscored: true })
export class JournalTemplate extends Model<JournalTemplate> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare tenant_id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @HasMany(() => JournalTemplateItem, { foreignKey: 'journal_template_id', as: 'items', onDelete: 'CASCADE' })
  declare items: JournalTemplateItem[];
}
