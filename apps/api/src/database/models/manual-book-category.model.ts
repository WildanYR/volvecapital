import { Optional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { ManualBook } from './manual-book.model';

export interface ManualBookCategoryAttributes {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ManualBookCategoryCreationAttributes
  extends Optional<ManualBookCategoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({
  tableName: 'manual_book_category',
  timestamps: true,
  underscored: true,
})
export class ManualBookCategory extends Model<ManualBookCategoryAttributes, ManualBookCategoryCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

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
  declare description: string;

  @ForeignKey(() => ManualBookCategory)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare parent_id: string | null;

  @BelongsTo(() => ManualBookCategory, 'parent_id')
  declare parent: ManualBookCategory;

  @HasMany(() => ManualBookCategory, 'parent_id')
  declare children: ManualBookCategory[];

  @HasMany(() => ManualBook)
  declare manual_books: ManualBook[];
}
