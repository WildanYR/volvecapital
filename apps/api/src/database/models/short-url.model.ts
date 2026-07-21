import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'short_urls',
  timestamps: true,
})
export class ShortUrl extends Model {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
  })
  declare id: string; // The 8-character random code

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare target_url: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expires_at: Date;
}
