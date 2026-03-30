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

export interface EmailMessageAttributes {
  id: string;
  from_email: string;
  subject: string;
  email_date: Date;
  parsed_context: string;
  parsed_data: string;
  created_at: Date;
  updated_at: Date;
}

interface EmailMessageCreationAttributes extends Optional<
  EmailMessageAttributes,
  'id' | 'created_at' | 'updated_at'
> {}

@Table({ tableName: 'email_message' })
export class EmailMessage extends Model<
  EmailMessageAttributes,
  EmailMessageCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare from_email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare subject: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare email_date: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare parsed_context: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare parsed_data: string;
}
