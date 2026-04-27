import { Optional } from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

export interface TutorialAttributes {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  thumbnail_url?: string;
  is_published?: boolean;
  steps?: any[];
  created_at?: Date;
  updated_at?: Date;
}

export interface TutorialCreationAttributes
  extends Optional<TutorialAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({
  tableName: 'tutorial',
  timestamps: true,
  underscored: true,
})
export class Tutorial extends Model<TutorialAttributes, TutorialCreationAttributes> {
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
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare is_published: boolean;

  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  declare steps: any[];
}
