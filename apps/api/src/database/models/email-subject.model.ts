import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface EmailSubjectAttributes {
  id: string;
  context: string;
  subject: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

interface EmailSubjectCreationAttributes
  extends Optional<
    EmailSubjectAttributes,
    'id' | 'is_public' | 'created_at' | 'updated_at'
  > {}

@Table({ tableName: 'email_subject' })
export class EmailSubject extends Model<EmailSubjectAttributes, EmailSubjectCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare context: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare subject: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare is_public: boolean;
}
