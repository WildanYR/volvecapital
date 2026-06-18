import { Optional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ManualBookCategory } from './manual-book-category.model';

export interface ManualBookAttributes {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ManualBookCreationAttributes
  extends Optional<ManualBookAttributes, 'id' | 'created_at' | 'updated_at' | 'status'> {}

@Table({
  tableName: 'manual_book',
  timestamps: true,
  underscored: true,
})
export class ManualBook extends Model<ManualBookAttributes, ManualBookCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => ManualBookCategory)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare category_id: string;

  @BelongsTo(() => ManualBookCategory)
  declare category: ManualBookCategory;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare content: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'DRAFT',
  })
  declare status: string;
}
