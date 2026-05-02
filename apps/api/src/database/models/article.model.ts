import { Optional } from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface ArticleAttributes {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  thumbnail_url?: string;
  category?: string;
  is_published?: boolean;
  content_steps?: any[];
  created_at?: Date;
  updated_at?: Date;
}

export interface ArticleCreationAttributes
  extends Optional<ArticleAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({
  tableName: 'article',
  timestamps: true,
  underscored: true,
})
export class Article extends Model<ArticleAttributes, ArticleCreationAttributes> {
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
  declare subtitle: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare thumbnail_url: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 'Umum',
  })
  declare category: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare is_published: boolean;

  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  declare content_steps: any[];
}
