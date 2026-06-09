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

export interface EmailMessageTSAttributes {
  id: string;
  tenant_id: string;
  from_email: string;
  subject: string;
  email_date: Date;
  parsed_context: string;
  parsed_data: string;
  created_at: Date;
}

interface EmailMessageTSCreationAttributes extends Optional<
  EmailMessageTSAttributes,
  'id' | 'created_at'
> {}

@Table({ tableName: 'email_message_ts', timestamps: false })
export class EmailMessageTS extends Model<
  EmailMessageTSAttributes,
  EmailMessageTSCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare tenant_id: string;

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

  @Column(DataType.DATE)
  declare created_at: Date;
}
